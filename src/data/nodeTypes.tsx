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
import {main} from "./projEntry"
import cycles from "./layers/cycles"

export const cycle = {
    shape: Shape.Circle,
    size: 50,
    title: "Cycles",
    label: "Cycles",
    outlineColor: "white",
    progress: () => Decimal.div(main.points.value, 10).min(0).mul(cycles.cycleMult.apply(1)),
    ProgressDisplay: ProgressDisplay.Outline,
    progressColor: cycles.color,
    onClick(node: BoardNode) {
        player.tabs.splice(1, 1, "c");
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