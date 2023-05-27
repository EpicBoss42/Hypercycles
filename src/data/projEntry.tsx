import Spacer from "components/layout/Spacer.vue";
import { jsx } from "features/feature";
import { createResource, trackBest, trackOOMPS, trackTotal } from "features/resources/resource";
import type { GenericTree } from "features/trees/tree";
import { branchedResetPropagation, createTree, defaultResetPropagation } from "features/trees/tree";
import { globalBus } from "game/events";
import type { BaseLayer, GenericLayer } from "game/layers";
import { createLayer } from "game/layers";
import type { Player } from "game/player";
import player from "game/player";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, toRaw } from "vue";
import cycles from "./layers/cycles";
import hypercycles from "./layers/hypercycles";
import brokencycles from "./layers/brokencycles";
import {
    cycle, 
    hypercycle,
    brokencycle,
    envelop,
    diamondOne,
    diamondTwo
} from "./nodeTypes";
import { BoardNodeLink, createBoard } from "features/boards/board";
import { createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";

const types = {
    cycle,
    hypercycle,
    brokencycle,
    envelop,
    diamondOne,
    diamondTwo
};

const pointsMult = createSequentialModifier(() => [
    createMultiplicativeModifier(() => ({
        multiplier: 2,
        enabled: cycles.upgrades.upg11.bought
    })),
    createMultiplicativeModifier(() => ({
        multiplier: cycles.upgradeEffects.upg12Effect,
        enabled: cycles.upgrades.upg12.bought
    })),
    createMultiplicativeModifier(() => ({
        multiplier: cycles.upgradeEffects.upg25Effect,
        enabled: cycles.upgrades.upg25.bought
    })),
    createMultiplicativeModifier(() => ({
        multiplier: hypercycles.upgradeEffects.upg11Effect,
        enabled: hypercycles.upgrades.upg11.bought
    }))
]);

/**
 * @hidden
 */
export const main = createLayer("main", function (this: BaseLayer) {
    const points = createResource<DecimalSource>(0);
    const best = trackBest(points);
    const total = trackTotal(points);

    const pointGain = computed(() => {
        // eslint-disable-next-line prefer-const
        let gain = new Decimal(1);
        gain = gain.times(pointsMult.apply(1));
        return gain;
    });
    globalBus.on("update", diff => {
        points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
    });
    const oomps = trackOOMPS(points, pointGain);

    const board = createBoard(board => ({
        startNodes: () => [
            {position: {x: 0, y: 0}, type: "envelop", id: 1},
            {position: {x: 0, y: 0}, type: "diamondOne", id: 2},
            {position: {x: 0, y: 0}, type: "cycle", id: 3}
        ],
        types: types,
        links: () => {
            let links = []
            if (board.nodes.value[4]) {
                links.push({
                    startNode: {position: {x:0, y:0}, id: 1, type: "envelop"},
                    endNode: {position: {x:200, y:0}, id: 4, type: "envelop"},
                    stroke: "var(--accent3)",
                    strokeWidth: 10
                })
            }
            if (board.nodes.value[8]) {
                links.push({
                    startNode: {position: {x:0, y:0}, id: 1, type: "envelop"},
                    endNode: {position: {x:-200, y:0}, id: 8, type: "envelop"},
                    stroke: "var(--accent3)",
                    strokeWidth: 10
                })
            }
            return links
        },
        style: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
        }
    }));

    const tree = createTree(() => ({
        nodes: [[cycles.treeNode], [hypercycles.treeNode, brokencycles.treeNode]],
        branches: [{startNode: hypercycles.treeNode, endNode: cycles.treeNode}],
        onReset() {
            points.value = toRaw(this.resettingNode.value) === toRaw(cycles.treeNode) ? 0 : 10;
            best.value = points.value;
            total.value = points.value;
        },
        resetPropagation: defaultResetPropagation
    })) as GenericTree;

    return {
        name: "Tree",
        links: tree.links,
        display: jsx(() => (
            <>
                {player.devSpeed === 0 ? <div>Game Paused</div> : null}
                {player.devSpeed != null && player.devSpeed !== 0 && player.devSpeed !== 1 ? (
                    <div>Dev Speed: {format(player.devSpeed)}x</div>
                ) : null}
                {player.offlineTime != null && player.offlineTime !== 0 ? (
                    <div>Offline Time: {formatTime(player.offlineTime)}</div>
                ) : null}
                <div>
                    {Decimal.lt(points.value, "1e1000") ? <span>You have </span> : null}
                    <h2>{format(points.value)}</h2>
                    {Decimal.lt(points.value, "1e1e6") ? <span> points</span> : null}
                </div>
                {Decimal.gt(pointGain.value, 0) ? <div>({(oomps.value)})</div> : null}
                <Spacer />
                {render(board)}
            </>
        )),
        points,
        best,
        total,
        oomps,
        tree,
        board
    };
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<Player>
): Array<GenericLayer> => [main, cycles, hypercycles, brokencycles];

/**
 * A computed ref whose value is true whenever the game is over.
 */
export const hasWon = computed(() => {
    return hypercycles.upgrades.upg15.bought.value
});

/**
 * Given a player save data object being loaded with a different version, update the save data object to match the structure of the current version.
 * @param oldVersion The version of the save being loaded in
 * @param player The save data being loaded in
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<Player>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
