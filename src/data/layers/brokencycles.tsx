/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { Conversion, ConversionOptions, createCumulativeConversion } from "features/conversion";
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
import { conditionalModifier, createAdditiveModifier, createMultiplicativeModifier, createSequentialModifier } from "game/modifiers";
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
import ouroboros from "./ouroboros";

const id = "bc";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Broken Cycle";
    const color = "#1759E7";
    const points = createResource<DecimalSource>(0, "broken cycles");

    const conversion: Conversion<ConversionOptions> = createCumulativeConversion(() => {
        if (ouroboros.trialOne.active.value) return {
            formula: x => x.max(0).div(10).pow(0.5),
            baseResource: hypercycles.points,
            gainResource: points
        };

        return {
            formula: x => x.max(0).div(5e6).pow(0.15).mul(conditionalModifier(ouroboros.trialOneEffect.value, "x", Decimal.gte(ouroboros.trialOne.completions.value, 0)).apply(1)),
            baseResource: cycles.points,
            gainResource: points
        }
    });

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

    const upg12 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 3
        })),
        display: {
            title: "Fragmenting Shards",
            description: "Fragmented Cycles increase Cyclic Shard's max"
        }
    }));

    const upg13 = createUpgrade(() => ({
        requirements: createCostRequirement(() => ({
            resource: noPersist(points),
            cost: 5
        })),
        display: {
            title: "Corrupted Upgrades",
            description: "You can disable Cycles upgrades to reduce Cycles' negative broken effect (disabling upgrades resets Cycles layer)"
        }
    }));

    const upgrades = {upg11, upg12, upg13};

    const disableGrid = createGrid(() => ({
        rows: 2,
        cols: 5,
        getStartState(id) {
            return true
        },
        getDisplay(id, state) {
            if (state) return `Disable Cycles Upgrade in row ${String(id)[0]}, column ${String(id)[2]}`;
            return `Enable Cycles Upgrade in row ${String(id)[0]}, column ${String(id)[2]}`;
        },
        onClick(id, state) {
            if (state) {
                cycles.brokenEffects.value.negative = Decimal.sub(cycles.brokenEffects.value.negative, 0.075);
            } else {
                cycles.brokenEffects.value.negative = Decimal.add(cycles.brokenEffects.value.negative, 0.075);
            };
            this.cells[id].state = !state;
            cycles.reset.reset();
        },
        visibility: upg13.bought
    }));
    
    return {
        name,
        color,
        points,
        upgrades,
        disableGrid,
        reset,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}<br></br>
                {renderRow(upg11, upg12, upg13)}<br></br>
                {render(disableGrid)}
                <br></br>
            </>
        )),
        treeNode,
        hotkey
    };
});

export default layer;