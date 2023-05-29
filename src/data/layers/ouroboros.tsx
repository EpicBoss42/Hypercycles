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
import { createGrid } from "features/grids/grid";
import { brokencycle } from "data/nodeTypes";
import brokencycles from "./brokencycles";

const id = "o";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Ouroboros";
    const color = "#1759E7";
    const points = createResource<DecimalSource>(0, "ouroboros trials");

    const conversion = createCumulativeConversion(() => ({
        formula: x => x.min(0).max(0),
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

    const trialOne = createChallenge(() => ({
        requirements: createBooleanRequirement(() => brokencycles.upgrades.upg13.bought.value),
        completionLimit: 1,
        display: () => ({
            title: "Primitive Self-Eating Snake",
            description: "Broken Cycles cost Hypercycles, Cycles' broken effects are disabled, and Supercycle is capped at ^2.5.  Cycles buyables are reset upon entry",
            goal: "Purchase Corrupted Upgrades",
            reward: "Hypercycles increase Broken Cycles gain, and you win the game",
            effectDisplay: `${format(trialOneEffect.value)}x`
        }),
        onEnter: () => {
            cycles.buyables.buy11.amount.value = 0;
            cycles.buyables.buy12.amount.value = 0;
            cycles.buyables.buy13.amount.value = 0;
            cycles.brokenStatus.value = false;
            hypercycles.reset.reset();
            brokencycles.reset.reset();
            cycles.reset.reset();
            main.points.value = 0;
        },
        onExit: () => {
            cycles.brokenStatus.value = true;
        },
        onComplete: () => {
            points.value = Decimal.add(points.value, 1)
        }
    }));
    const trialOneEffect = computed(() => {
        let base = Decimal.add(hypercycles.points.value, 1);
        return Formula.variable(base).pow(0.25).log(3).add(1).evaluate()
    });
    
    return {
        name,
        color,
        points,
        trialOne,
        trialOneEffect,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {renderRow(trialOne)}
                <br></br>
            </>
        )),
        treeNode
    };
});

export default layer;