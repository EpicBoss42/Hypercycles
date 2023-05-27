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
import { render, renderCol, renderRow } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import { createUpgrade } from "features/upgrades/upgrade";
import { createBooleanRequirement, createCostRequirement } from "game/requirements";
import { noPersist, persistent } from "game/persistence";
import { createAdditiveModifier, createMultiplicativeModifier, createSequentialModifier, conditionalModifier, Modifier, createExponentialModifier } from "game/modifiers";
import { ComputedRef, computed } from "vue";
import Formula from "game/formulas/formulas";
import { format } from "util/break_eternity";
import { Repeatable, RepeatableOptions, createRepeatable } from "features/repeatable";
import { Challenge, ChallengeOptions, createChallenge } from "features/challenges/challenge";
import { Computable } from "util/computed";
import { getUniqueNodeID } from "features/boards/board";
import hypercycles from "./hypercycles";
import { WithRequired } from "util/common";
import BoardLink from "features/boards/BoardLink.vue";
import { createInfobox } from "features/infoboxes/infobox";
import { createClickable } from "features/clickables/clickable";
import { cycle } from "data/nodeTypes";
import brokencycles from "./brokencycles";

const id = "c";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Cycle";
    const color = "#4BDC13";
    const points = createResource<DecimalSource>(0, "cycles");
    const cycleValue = createResource<DecimalSource>(0, "cycle length");
    const visibilityStatuses = persistent<{
        upg21: boolean, 
        upg22: boolean, 
        upg23: boolean, 
        upg24: boolean, 
        upg25: boolean, 
        buy11: boolean,
        buy12: boolean,
        buy13: boolean,
        chal11: boolean
    }>({
        upg21: false,
        upg22: false,
        upg23: false,
        upg24: false,
        upg25: false,
        buy11: false,
        buy12: false,
        buy13: false,
        chal11: false,
    });
    const brokenStatus = persistent<boolean>(false);
    const brokenEffects = persistent<{positive: DecimalSource, negative: DecimalSource}>({
        positive: 1.15,
        negative: 2
    });
    
    
    const conversion = createCumulativeConversion(() => {
        return {
        formula: x => x.max(0).div(10).sqrt().times(cycleMultiplier).pow(conditionalModifier(brokenEffects.value.positive, "x", brokenStatus.value).apply(1)),
        baseResource: main.points,
        gainResource: points
    }});

    const cycleMult: WithRequired<Modifier, "invert"|"enabled"|"getFormula"> = createSequentialModifier(() => [
        createMultiplicativeModifier(() => ({
            multiplier: upg22Effect, 
            enabled: upg22.bought
        })),
        createMultiplicativeModifier(() => ({
            multiplier: hypercycles.upgradeEffects.upg12Effect,
            enabled: hypercycles.upgrades.upg12.bought
        })),
        createMultiplicativeModifier(() => ({
            multiplier: hypercycles.upgradeEffects.upg15Effect,
            enabled: hypercycles.upgrades.upg15.bought
        }))
    ]);

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => {
            const toReset = {
                id,
                name,
                color,
                treeNode,
                upgrades,
                points,
                buyables
            };

            if (hypercycles.upgrades.upg14.bought.value != true) return [...[toReset], challenges]

            return [toReset];
        },
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
    const upg12Effect: ComputedRef<Decimal> = computed(() => {
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
                addend: buyableEffects.buy11Effect.value
            })),
            createMultiplicativeModifier(() => ({
                multiplier: 0.5,
                enabled: chal11.active
            })),
            createMultiplicativeModifier(() => ({
                multiplier: Decimal.recip(brokenEffects.value.negative),
                enabled: brokenStatus.value
            })),
            createExponentialModifier(() => ({
                exponent: 0.75,
                enabled: chal12.active
            }))
        ]);

        const upg12MinModifier = createSequentialModifier(() => [
            createAdditiveModifier(() => ({
                addend: 0.4,
                enabled: upg13.bought
            })),
            createAdditiveModifier(() => ({
                addend: -1.5,
                enabled: upg23.bought && !chal11.active.value && !chal12.active.value
            })),
            createAdditiveModifier(() => ({
                addend: 1,
                enabled: brokenStatus.value && upg23.bought && !chal12.active.value && !chal11.active.value
            }))
        ]);

        let base = new Decimal(cycleValue.value);
        let base2 = new Decimal(cycleValue.value);
        const duration = new Decimal(upg12DurationModifier.apply(3.14));
        const maximum = new Decimal(upg12MaxModifier.apply(3));
        const minimum = new Decimal(upg12MinModifier.apply(0.1));
        const exponent = new Decimal(conditionalModifier(upg23Effect.value, "x", upg23.bought).apply(1));

        base = base.div(duration).sin().mul(maximum).abs().pow(exponent);

        if (brokencycles.upgrades.upg11.bought.value) base2 = base2.div(duration).cos().mul(maximum).abs().pow(exponent)
        
        return base.add(minimum).add(conditionalModifier(base2, "+", brokencycles.upgrades.upg11.bought).apply(0));
    });

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
        return Decimal.recip(base).mul(conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1)).min(1)
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
        base = base.add(1).min(conditionalModifier("-1ee10", "+", chal11.active).apply(Decimal.add("1ee10", 2)))
        return Formula.variable(base).step(1e6, f => f.pow(0.5)).div(conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1)).max(1).evaluate()
    });

    const upg23 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 1000
        })),
        display: () => ({
            title: "Supercycle",
            description: "The effect of Cycle of Points is squared, but the minimum is drastically lowered and buyables are reset",
            effectDisplay: `^${format(upg23Effect.value)}`
        }),
        visibility: () => (Decimal.gte(buy12.amount.value, 5) || visibilityStatuses.value.upg23),
        onPurchase: () => {
            buy11.amount.value = 0
            buy12.amount.value = 0
            buy13.amount.value = 0
            visibilityStatuses.value.upg23 = true
        }
    }));
    const upg23Effect = computed(() => {
        let base = new Decimal(1);
        base = base.add(conditionalModifier(1, "+", upg23.bought).apply(0));
        base = base.add(conditionalModifier(1, "+", Decimal.gte(chal11.completions.value, 1)).apply(0));
        base = base.add(conditionalModifier(hypercycles.upgradeEffects.upg13Effect.value, "+", hypercycles.upgrades.upg13.bought).apply(0))
        if (chal11.active.value || chal12.active.value) return new Decimal(1)
        return Formula.variable(base).div(conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1)).max(1).evaluate();
    });

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
        return Formula.variable(base).add(1).step(1e7, f => f.pow(0.5)).div(conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1)).max(1).evaluate()
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
            visibilityStatuses.value.upg25 = true;
            visibilityStatuses.value.chal11 = true;
        }
    }));
    const upg25Effect = computed(() => {
        let base = Decimal.max(points.value, 1);
        base = base.pow(0.25).div(3);
        return Formula.variable(base).add(1).step(5e5, f => f.pow(0.4)).div(conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1)).evaluate();
    });

    const upgrades = {upg11, upg12, upg13, upg14, upg15, upg21, upg22, upg23, upg24, upg25};
    const upgradeEffects = {upg12Effect, upg21Effect, upg22Effect, upg24Effect, upg25Effect};

    // @ts-ignore
    const buy11 = createRepeatable(() => ({
        requirements: [createCostRequirement(() => ({
            resource: noPersist(points),
            cost: Formula.variable(buy11.amount).add(1).mul(10)
        })),
        createBooleanRequirement(() => {
            let amount = Formula.variable(buy11.amount).pow_base(Decimal.sub(1.7, buy12Effect.value.increase.div(upg24EApplier.apply(1)).add(1).div(conditionalModifier(10, "x", Decimal.gte(buy11.amount.value, 40)).apply(5)))).add(2).step(20, f => f.pow(3)).step(8e6, g => g.pow(4)).evaluate();
            amount = Decimal.div(amount, conditionalModifier("1", "+", chal11.active).apply(1));
            amount = Decimal.div(amount, conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1));
            amount = Decimal.pow(amount, conditionalModifier(0.75, "x", chal12.active).apply(1));
            return upg12Effect.value.gte(amount)
        })],
        display: () => {
            let amount = Formula.variable(buy11.amount).pow_base(Decimal.sub(1.7, buy12Effect.value.increase.div(upg24EApplier.apply(1)).add(1).div(conditionalModifier(10, "x", Decimal.gte(buy11.amount.value, 40)).apply(5)))).add(2).step(20, f => f.pow(3)).step(8e6, g => g.pow(4)).evaluate();
            amount = Decimal.div(amount, conditionalModifier("1", "+", chal11.active).apply(1));
            amount = Decimal.div(amount, conditionalModifier(brokenEffects.value.negative, "x", brokenStatus.value).apply(1));
            amount = Decimal.pow(amount, conditionalModifier(0.75, "x", chal12.active).apply(1));
            return {
                title: "Fractured Cycle",
                description: `Resets current Cycle of Points effect, but increases its maximum value.
                            C.O.P. value required: ${format(amount)}`,
                effectDisplay: `+${format(buy11Effect.value)}`
            }
        },
        onClick: () => {
            cycleValue.value = new Decimal(0);
            visibilityStatuses.value.buy11 = true;
        },
        visibility: () => { return upg15.bought.value || visibilityStatuses.value.buy11}
    }));
    const buy11Effect = computed(() => {
        let base = new Decimal(buy11.amount.value)
        if (Decimal.gte(chal12.completions.value, 1)) base = base.add(chal12Bonus.value);

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
            return Decimal.gte(buy11.amount.value, 3) || visibilityStatuses.value.buy12
        },
        onClick: () => {
            cycleValue.value = new Decimal(0);
            buy11.amount.value = new Decimal(0);
            visibilityStatuses.value.buy12 = true;
        },
        limit: 5
    }));
    const buy12Effect = computed(() => {
        let base = new Decimal(buy12.amount.value)
        if (Decimal.gte(chal12.completions.value, 1)) base = base.add(chal12Bonus.value);
        let dec = Decimal.div(1, base.div(5).add(1))
        let inc = base.div(3).add(buy13Effect.value)

        inc = inc.mul(upg24EApplier.apply(1))

        return {
            decrease: dec,
            increase: inc
        }
    });

    // @ts-ignore
    const buy13 = createRepeatable(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(createResource(buy12.amount, "Cyclic Shards")),
            cost: Formula.variable(buy13.amount).step(2, f => f.mul(1.5)).add(4).floor()
        })),
        display: () => ({
            title: "Fragmented Cycles",
            description: "Increases Cyclic Shard's effect",
            effectDisplay: `+${format(buy13Effect.value)}`
        }),
        visibility: () => {return Decimal.gte(hypercycles.points.value, 5) || visibilityStatuses.value.buy13},
        onClick: () => {
            cycleValue.value = new Decimal(0);
            buy11.amount.value = new Decimal(0);
            buy12.amount.value = new Decimal(0);
            visibilityStatuses.value.buy13 = true;
        }
    }));
    const buy13Effect = computed(() => {
        let base = Decimal.add(buy13.amount.value, 1);
        if (Decimal.gte(chal12.completions.value, 1)) base = base.add(chal12Bonus.value);
        return Formula.variable(base).pow(0.5).log(2).evaluate();
    })

    const buyables = {buy11, buy12, buy13};
    const buyableEffects = {buy11Effect, buy12Effect, buy13Effect};

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
            buy13.amount.value = 0;
        },
        onComplete: () => {
            if (!main.board.nodes.value[4]) {
                main.board.nodes.value.push({
                    id: 4,
                    position: {x: 200, y: 0},
                    type: "envelop"
                },
                {
                    id: 5,
                    position: {x: 200, y: 0},
                    type: "diamondOne"
                },
                {
                    id: 6,
                    position: {x: 200, y: 0},
                    type: "diamondTwo"
                },
                {
                    id: 7,
                    position: {x: 200, y: 0},
                    type: "hypercycle"
                }
                );
            }
        },
        visibility: () => upg25.bought.value || visibilityStatuses.value.chal11
    }));

    //@ts-ignore
    const chal12: Challenge<ChallengeOptions> = createChallenge(() => ({
        requirements: createBooleanRequirement(() => Decimal.gte(buy13.amount.value, 1)),
        completionLimit: () => new Decimal(1),
        display: () => ({
            title: "Loop of Trials",
            description: "Supercycle is disabled, as are Hypercyclic Points and Extra Super Cycles. Cycle of Points' max is raised ^0.75, and your buyables are reset on entry.",
            goal: "1 Faceted Cycle",
            reward: "Bonus Buyable amounts based on Cycles and Hypercycles, and the positive Broken Cycles effect is increased.",
            effectDisplay: `+${format(chal12Bonus.value)}`
        }),
        onEnter: () => {
            buy11.amount.value = 0;
            buy12.amount.value = 0;
            buy13.amount.value = 0;
        },
        visibility: () => {return Decimal.gte(hypercycles.points.value, 10) && upg23.bought.value},
        onComplete: () => {
            brokenEffects.value.positive = 1.3;
        }
    }));
    const chal12Bonus = computed(() => {
        let cbase = Decimal.add(points.value, 1)
        let hbase = Decimal.add(hypercycles.points.value, 1)

        cbase = new Decimal(Formula.variable(cbase).pow(0.1).log(5).evaluate())
        return Formula.variable(hbase).pow(0.2).log(3).add(cbase).step(3, f => f.pow(0.5)).evaluate()
    });

    const challenges = {chal11, chal12};

    // Extremely jank solution to get certain values to constantly update
    const cycleMultiplier = createResource<DecimalSource>(cycleMult.apply(1));
    const updaters = {cycleMultiplier}

    this.on("update", diff => {
        cycleValue.value = Decimal.add(cycleValue.value, diff);
        if (Decimal.gte(chal11.completions.value, 1) && (main.tree.isResetting.value != true)) {
            points.value = Decimal.mul(conversion.currentGain.value, diff).div(10).add(points.value);
        };
        cycleMultiplier.value = cycleMult.apply(1);
    });

    return {
        name,
        color,
        points,
        upgrades,
        upgradeEffects,
        buyables,
        buyableEffects,
        challenges,
        cycleMult,
        updaters,
        cycleValue,
        visibilityStatuses,
        tooltip,
        brokenStatus,
        brokenEffects,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}<br></br>
                {brokenStatus.value ? <><h2>Currently Broken:</h2><br></br></> : <> </>}
                {brokenStatus.value ? <><h3>^{format(brokenEffects.value.positive)} Cycles Gain</h3><br></br></>: <> </>}
                {brokenStatus.value ? <><h3>{format(Decimal.recip(brokenEffects.value.negative))}x Cycles Upgrades effect</h3><br></br></>: <> </>}
                {renderRow(upg11, upg12, upg13, upg14, upg15)}
                {renderRow(upg21, upg22, upg23, upg24, upg25)}
                <br></br>
                {renderRow(buy11, buy12, buy13)}
                <br></br>
                {renderRow(chal11, chal12)}
            </>
        )),
        treeNode,
        hotkey,
        reset
    };
});

export default layer;
