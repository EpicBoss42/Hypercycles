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
import { getUniqueNodeID } from "features/boards/board";
import brokencycles from "./brokencycles";

const id = "hc";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Hypercycle";
    const color = "#BD5DD8";
    const points = createResource<DecimalSource>(0, "hypercycles");

    const conversion = createCumulativeConversion(() => ({
        formula: x => x.max(0).div(50000).pow(0.1),
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
        description: "Reset for hypercycles",
        key: "h",
        onPress: resetButton.onClick
    }));

    const upg11 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 1
        })),
        display: () => ({
            title: "Hypercyclic Points",
            description: "Cycles increase Point gain",
            effectDisplay: `${format(upg11Effect.value)}x`
        })
    }));
    const upg11Effect = computed(() => {
        let base = Decimal.add(cycles.points.value, 1);
        if (cycles.challenges.chal12.active.value) return new Decimal(1)
        return Formula.variable(base).pow(0.3).add(1).step(100, f => f.pow(0.3)).evaluate();
    });

    const upg12 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 5
        })),
        display: () => ({
            title: "Branching Fractures",
            description: "Fractured Cycles increase Cycles gain",
            effectDisplay: `${format(upg12Effect.value)}x`
        })
    }));
    const upg12Effect = computed(() => {
        let base = Decimal.add(cycles.buyables.buy11.amount.value, 1);
        return Formula.variable(base).pow(0.25).evaluate();
    });

    const upg13 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 10
        })),
        display: () => ({
            title: "Extra Super Cycles",
            description: "Hypercycles increase Supercycle effect",
            effectDisplay: `+${format(upg13Effect.value)}`
        })
    }));
    const upg13Effect = computed(() => {
        let base = Decimal.add(points.value, 1);
        if (cycles.challenges.chal12.active.value) return new Decimal(0)
        return Formula.variable(base).pow(0.05).log(2).step(2, f => f.pow(0.5)).evaluate()
    });

    const upg14 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 25
        })),
        display: {
            title: "Finally Broken",
            description: "Breaks your Cycles and you keep Cycles Challenges completions on resets"
        },
        onPurchase: () => {
            cycles.brokenStatus.value = true;
            brokencycles.points.value = new Decimal(1);
            main.board.nodes.value.push({
                id: 8,
                position: {x: -200, y: 0},
                type: "envelop"
            },
            {
                id: 9,
                position: {x: -200, y: 0},
                type: "diamondOne"
            },
            {
                id: 10,
                position: {x: -200, y: 0},
                type: "diamondTwo"
            },
            {
                id: 11,
                position: {x: -200, y: 0},
                type: "brokencycle"
            }
            );
        }
    }));

    const upg15 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 5000
        })),
        display: () => ({
            title: "Hypercyclic Mastery",
            description: "Hypercycles increase Cycles gain",
            effectDisplay: `${format(upg15Effect.value)}x`
        }),
        onPurchase: () => {
            
        }
    }));
    const upg15Effect = computed(() => {
        let base = Decimal.add(points.value, 1)
        return Formula.variable(base).pow(0.2).log(3).add(1).evaluate()
    });

    const upgrades = {upg11, upg12, upg13, upg14, upg15};
    const upgradeEffects = {upg11Effect, upg12Effect, upg13Effect, upg15Effect};

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
                {renderRow(upg11, upg12, upg13, upg14, upg15)}<br></br>
                <br></br>
            </>
        )),
        treeNode,
        hotkey
    };
});

export default layer;