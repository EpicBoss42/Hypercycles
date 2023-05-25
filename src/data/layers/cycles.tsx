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
import { createResource, displayResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { BaseLayer, createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum"
import { computeComponent, render, renderCol, renderRow } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import { Upgrade, UpgradeOptions, createUpgrade } from "features/upgrades/upgrade";
import { createBooleanRequirement, createCostRequirement, requirementsMet } from "game/requirements";
import { DefaultValue, noPersist, persistent } from "game/persistence";
import { createAdditiveModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
import { computed } from "vue";
import { PI_2 } from "@pixi/math";
import Formula from "game/formulas/formulas";
import { createInfobox } from "features/infoboxes/infobox";
import { format } from "util/break_eternity";
import { createClickable } from "features/clickables/clickable";
import { Repeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { createChallenge } from "features/challenges/challenge";
import { Computable } from "util/computed";

const id = "c";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Cycle";
    const color = "#4BDC13";
    const points = createResource<DecimalSource>(0, "cycles");
    const cycleValue = createResource<DecimalSource>(0, "cycle length");
    const visibilityStatuses = persistent<{upg21: boolean, upg22: boolean, upg23: boolean, upg24: boolean, upg25: boolean}>({
        upg21: false,
        upg22: false,
        upg23: false,
        upg24: false,
        upg25: false
    });

    function conditionalIncrease(factor: DecimalSource, type: "+"|"x", enabled: Computable<boolean>) {
        if (type == "+") {
            return noPersist(createSequentialModifier(() => [
                createAdditiveModifier(() => ({
                    addend: factor,
                    enabled: enabled
                }))
            ]))
        }
        else {
            return noPersist(createSequentialModifier(() => [
                createMultiplicativeModifier(() => ({
                    multiplier: factor,
                    enabled: enabled
                }))
            ]))
        }
    }
    
    const conversion = createCumulativeConversion(() => ({
        formula: x => x.max(0).div(10).sqrt().times(cycleMult.apply(1)),
        baseResource: main.points,
        gainResource: points
    }));

    const cycleMult = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: upg22Effect, 
            enabled: upg22.bought
        }))
    ]);

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset
    }));
    const tooltip = addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const hotkey = createHotkey(() => ({
        description: "Reset for cycles",
        key: "c",
        onPress: resetButton.onClick
    }));

    const totalMult = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: upg11.bought
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upg12Effect,
            enabled: upg12.bought
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upg25Effect,
            enabled: upg25.bought
        }))
    ]);

    const upg11 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 1
        })),
        display: {
            title: "Dual Cycle",
            description: "Double your points"
        }
    }));

    const upg12 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 5
        })),
        display: () => ({
            title: "Cycle of Points",
            description: "Your point gain is increased or decreased cyclically over time",
            effectDisplay: `${format(upg12Effect.value)}x`
        })
    }));
    const upg12Effect = computed(() => {
        let base = new Decimal(cycleValue.value);
        let duration = new Decimal(upg12DurationModifier.apply(3.14));
        let maximum = new Decimal(upg12MaxModifier.apply(3));
        let minimum = new Decimal(upg12MinModifier.apply(0.1));
        let exponent = new Decimal(upg12ExpModifier.apply(1))

        base = base.div(duration).sin().mul(maximum).abs().pow(exponent);
        return base.add(minimum);
    });

    const upg12DurationModifier = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: 6,
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: upg14.bought
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 2,
            enabled: upg15.bought
        })),
        createMultiplicativeModifier(() => ({
            multiplier: buy12Effect.value.decrease
        })),
        createMultiplicativeModifier(() => ({
            multiplier: upg21Effect.value,
            enabled: upg21.bought
        }))
    ]);

    const upg12MaxModifier = createSequentialModifier(() => [
        createAdditiveModifier(() => ({
            addend: -1,
            enabled: upg13.bought
        })),
        createAdditiveModifier(() => ({
            addend: 0.5,
            enabled: upg14.bought
        })),
        createAdditiveModifier(() => ({
            addend: 0.25,
            enabled: upg15.bought
        })),
        createAdditiveModifier(() => ({
            addend: buy11Effect,
            enabled: Decimal.gt(buy11.amount.value, 0)
        })),
        createMultiplicativeModifier(() => ({
            multiplier: 0.5,
            enabled: chal11.active
        }))
    ]);

    const upg12MinModifier = createSequentialModifier(() => [
        createAdditiveModifier(() => ({
            addend: 0.4,
            enabled: upg13.bought
        })),
        createAdditiveModifier(() => ({
            addend: -1.5,
            enabled: upg23.bought 
        })),
        createAdditiveModifier(() => ({
            addend: 1.5,
            enabled: chal11.active
        }))
    ]);

    const upg12ExpModifier = createSequentialModifier(() => [
        createAdditiveModifier(() => ({
            addend: 1,
            enabled: upg23.bought 
        })),
        createAdditiveModifier(() => ({
            addend: -1,
            enabled: chal11.active
        })),
        createAdditiveModifier(() => ({
            addend: 1,
            enabled: Decimal.gte(chal11.completions.value, 1)
        }))
    ]);

    const upg13 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 15
        })),
        display: {
            title: "Smaller Cycles",
            description: "The minimum effect of Cycle of Points is increased, but the maximum is decreased"
        }
    }));

    const upg14 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 25
        })),
        display: {
            title: "Stretched Cycles",
            description: "Increases the cycle length and maximum effect of Cycle of Points"
        }
    }));

    const upg15 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 30
        })),
        display: {
            title: "Minor Fractures",
            description: "Further increases Cycle of Points' cycle length and max effect"
        }
    }));

    const upg21 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 300
        })),
        display: () => ({
            title: "Shattered Cycle",
            description: "Cycles decrease Cycle of Points' cycle length",
            effectDisplay: `${format(upg21Effect.value)}x`
        }),
        visibility: () => (Decimal.gte(buy12.amount.value, 3) || visibilityStatuses.value.upg21),
        onPurchase: () => {
            visibilityStatuses.value.upg21 = true
        }
    }));
    const upg21Effect = computed(() => {
        let base = Decimal.add(points.value, 1)
        base = base.pow(0.1).add(0.5)
        return Decimal.div(1, base)
    });

    const upg22 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 500
        })),
        display: () => ({
            title: "Recycled Points",
            description: "Points increase Cycles gain",
            effectDisplay: `${format(upg22Effect.value)}x`
        }),
        visibility: () => (Decimal.gte(buy12.amount.value, 5) || visibilityStatuses.value.upg22),
        onPurchase: () => {
            visibilityStatuses.value.upg22 = true
        }
    }));
    const upg22Effect = computed(() => {
        let base = Decimal.add(main.points.value, 1).max(1)
        base = base.pow(0.2).div(3)
        return base.add(1).min(conditionalIncrease("-1000000", "+", chal11.active).apply(1000002))
    });

    const upg23 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 1000
        })),
        display: {
            title: "Supercycle",
            description: "The effect of Cycle of Points is squared, but the minimum is drastically lowered and buyables are reset"
        },
        visibility: () => (Decimal.gte(buy12.amount.value, 5) || visibilityStatuses.value.upg23),
        onPurchase: () => {
            buy11.amount.value = 0
            buy12.amount.value = 0
            visibilityStatuses.value.upg23 = true
        }
    }));

    const upg24 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 7500
        })),
        display: () => ({
            title: "Pointed Shards",
            description: "Cyclic Shard's effect is increased by points",
            effectDisplay: `${format(upg24Effect.value)}x`
        }),
        visibility: () => (Decimal.gte(buy12.amount.value, 5) || visibilityStatuses.value.upg24),
        onPurchase: () => {
            visibilityStatuses.value.upg24 = true
        }
    }));
    const upg24Effect = computed(() => {
        let base = Decimal.max(main.points.value, 1).max(1)
        base = base.pow(0.2).div(5)
        return base.add(1)
    });
    const upg24EApplier = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({multiplier: upg24Effect, enabled: upg24.bought}))
    ]);

    const upg25 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 25000
        })),
        display: () => ({
            title: "Cyclic Points",
            description: "Cycles boost Point gain",
            effectDisplay: `${format(upg25Effect.value)}x`
        }),
        visibility: () => (Decimal.gte(buy12.amount.value, 5) || visibilityStatuses.value.upg25),
        onPurchase: () => {
            visibilityStatuses.value.upg25 = true
        }
    }));
    const upg25Effect = computed(() => {
        let base = Decimal.max(points.value, 1);
        base = base.pow(0.25).div(3);
        return base.add(1);
    });

    const upgrades = {upg11, upg12, upg13, upg14, upg15, upg21, upg22, upg23, upg24, upg25};

    // @ts-ignore
    const buy11 = createRepeatable(() => ({
        requirements: [createCostRequirement(() => ({
            resource: noPersist(points),
            cost: Formula.variable(buy11.amount).add(1).mul(10)
        })),
        createBooleanRequirement(() => {
            let amount = Formula.variable(buy11.amount).pow_base(Decimal.sub(1.7, buy12Effect.value.increase.div(upg24EApplier.apply(1)).add(1).div(5))).add(2).step(20, f => f.pow(3)).evaluate();
            amount = Decimal.div(amount, conditionalIncrease("1", "+", chal11.active).apply(1));
            return upg12Effect.value.gte(amount)
        })],
        display: () => {
            let amount = Formula.variable(buy11.amount).pow_base(Decimal.sub(1.7, buy12Effect.value.increase.div(upg24EApplier.apply(1)).add(1).div(5))).add(2).step(20, f => f.pow(3)).evaluate();
            amount = Decimal.div(amount, conditionalIncrease("1", "+", chal11.active).apply(1));
            return {
                title: "Fractured Cycle",
                description: `Resets current Cycle of Points effect, but increases its maximum value.
                            C.O.P. value required: ${format(amount)}`,
                effectDisplay: `+${format(buy11Effect.value)}`
            }
        },
        onClick: () => {
            cycleValue.value = new Decimal(0)
        },
        visibility: upg15.bought
    }));
    const buy11Effect = computed(() => {
        let base = new Decimal(buy11.amount.value)

        base = base.mul(buy12Effect.value.increase.add(1))

        return base
    });

    // @ts-ignore
    const buy12 = createRepeatable<{}>(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(createResource(buy11.amount, "Fractured Cycles")),
            cost: Formula.variable(buy12.amount).add(1).mul(2).div(3).pow(2).add(3.5).ceil()
        })),
        display: () => ({
            title: "Cyclic Shard",
            description: "Decreases Cycle of Points' cycle length and increases Fractured Cycle's effect.",
            effectDisplay: `${format(buy12Effect.value.decrease)}x, +${format(buy12Effect.value.increase)}`
        }),
        visibility: () => {
            return Decimal.gte(buy11.amount.value, 3) || Decimal.gt(buy12.amount.value, 0)
        },
        onClick: () => {
            cycleValue.value = new Decimal(0);
            buy11.amount.value = new Decimal(0);
        },
        limit: 5
    }));
    const buy12Effect = computed(() => {
        const base = new Decimal(buy12.amount.value)
        let dec = Decimal.div(1, base.div(5).add(1))
        let inc = base.div(3)

        inc = inc.mul(upg24EApplier.apply(1))

        return {
            decrease: dec,
            increase: inc
        }
    });

    const buyables = {buy11, buy12};

    const chal11 = createChallenge(() => ({
        requirements: createBooleanRequirement(() => Decimal.gte(buy12.amount.value, 2)),
        completionLimit: () => new Decimal(1),
        display: () => ({
            title: "Cycle of Difficulties",
            description: "Supercycle is disabled, Recycled Points is capped at 2x, Cycle of Points' max is halved, and your buyables are reset on entry.",
            goal: "2 Cyclic Shards",
            reward: "Supercycle is cubed rather than squared, and you gain 10% of your Cycles gain on reset each second."
        }),
        onEnter: () => {
            buy11.amount.value = 0;
            buy12.amount.value = 0;
        },
        visibility: () => upg25.bought.value
    }));

    const challenges = {chal11};

    this.on("update", diff => {
        cycleValue.value = Decimal.add(cycleValue.value, diff);
        if (Decimal.gte(chal11.completions.value, 1)) {
            points.value = Decimal.mul(conversion.currentGain.value, diff).div(10).add(points.value);
        };
    });

    return {
        name,
        color,
        points,
        upgrades,
        buyables,
        challenges,
        cycleMult,
        totalMult,
        cycleValue,
        visibilityStatuses,
        tooltip,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}<br></br>
                {renderRow(upg11, upg12, upg13, upg14, upg15)}
                {renderRow(upg21, upg22, upg23, upg24, upg25)}
                <br></br>
                {renderRow(buy11, buy12)}
                <br></br>
                {render(chal11)}
            </>
        )),
        treeNode,
        hotkey
    };
});

export default layer;
