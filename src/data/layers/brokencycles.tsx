/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion } from "features/conversion";
import { jsx } from "features/feature";
import { createHotkey } from "features/hotkey";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { BaseLayer, createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum"
import { render, renderRow } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import { createUpgrade } from "features/upgrades/upgrade";
import { createBooleanRequirement, createCostRequirement } from "game/requirements";
import { noPersist, persistent } from "game/persistence";
import { createAdditiveModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { computed } from "vue";
import Formula from "game/formulas/formulas";
import { format } from "util/break_eternity";
import { createRepeatable } from "features/repeatable";
import { createChallenge } from "features/challenges/challenge";
import { Computable } from "util/computed";
import cycles from "./cycles";
import hypercycles from "./hypercycles";
import { getUniqueNodeID } from "features/boards/board";

const id = "bc";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Broken Cycle";
    const color = "#1759E7";
    const points = createResource<DecimalSource>(0, "broken cycles");

    const conversion = createCumulativeConversion(() => ({
        formula: x => x.max(0).div(5e6).pow(0.1),
        baseResource: cycles.points,
        gainResource: points
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer],
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const hotkey = createHotkey(() => ({
        description: "Reset for broken cycles",
        key: "b",
        onPress: resetButton.onClick
    }));

    const upg11 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 2
        })),
        display: {
            title: "Misalignment",
            description: "Adds a new cycle to Cycle of Points' effect"
        }
    }));

    const upgrades = {upg11};
    const upgradeEffects = {};

    return {
        name,
        color,
        points,
        upgrades,
        upgradeEffects,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}<br></br>
                {renderRow(upg11)}<br></br>
                <br></br>
            </>
        )),
        treeNode,
        hotkey
    };
});

export default layer;