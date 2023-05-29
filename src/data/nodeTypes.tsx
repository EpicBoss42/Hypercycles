import {
    BoardNode,
    GenericBoard,
    NodeTypeOptions,
    ProgressDisplay,
    Shape,
    getUniqueNodeID
} from "features/boards/board";
import { addLayer, layers, removeLayer } from "game/layers";
import player from "game/player";
import Decimal from "util/bignum";
import { format, formatWhole } from "util/break_eternity";
import { camelToTitle } from "util/common";
import {main} from "./projEntry";
import cycles from "./layers/cycles";
import hypercycles from "./layers/hypercycles";
import brokencycles from "./layers/brokencycles";
import ouroboros from "./layers/ouroboros";

export const cycle = {
    shape: Shape.Circle,
    size: 50,
    title: "Cycles",
    label: "Cycles",
    outlineColor: "white",
    progress: () => Decimal.div(main.points.value, cycles.nextAt).max(0).min(1),
    ProgressDisplay: ProgressDisplay.Outline,
    progressColor: cycles.color,
    onClick(node: BoardNode) {
        player.tabs.splice(1, 1, "c");
    }
} as unknown as NodeTypeOptions;

export const hypercycle = {
    shape: Shape.Circle,
    size: 50,
    title: "Hypercycles",
    label: "Hypercycles",
    outlineColor: "white",
    progress: () => Decimal.div(cycles.points.value, 50000).max(0).min(1),
    ProgressDisplay: ProgressDisplay.Outline,
    progressColor: hypercycles.color,
    onClick(node: BoardNode) {
        player.tabs.splice(1, 1, "hc")
    }
} as unknown as NodeTypeOptions;

export const brokencycle = {
    shape: Shape.Circle,
    size: 50,
    title: "Broken Cycles",
    label: "Broken Cycles",
    outlineColor: "white",
    progress: () => {
        if (ouroboros.trialOne.active.value) return Decimal.div(hypercycles.points.value, 10).max(0).min(1)
        return Decimal.div(cycles.points.value, 5e6).max(0).min(1)
    },
    ProgressDisplay: ProgressDisplay.Outline,
    progressColor: brokencycles.color,
    onClick(node: BoardNode) {
        player.tabs.splice(1, 1, "bc")
    }
} as unknown as NodeTypeOptions;

export const ourobori = {
    shape: Shape.Circle,
    size: 208.5,
    title: "⥀",
    label: "Ouroboros Trials",
    outlineColor: "white",
    onClick(node: BoardNode) {
        player.tabs.splice(1, 1, "o")
    }
} as unknown as NodeTypeOptions;

export const envelop = {
    shape: Shape.Circle,
    size: 60,
    fillColor: "black",
    outlineColor: "white",
    onClick() {return}
} as unknown as NodeTypeOptions;

export const diamondOne = {
    shape: Shape.Diamond,
    size: 59,
    outlineColor: "white",
    onClick() {return}
} as unknown as NodeTypeOptions;

export const diamondTwo = {
    shape: Shape.Square,
    size: 49,
    outlineColor: "white",
    onClick() {return}
} as unknown as NodeTypeOptions;