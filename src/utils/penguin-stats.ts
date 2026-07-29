import * as T from "hella-types";
import { paths } from '../constants.json';
import * as api from './api';

export async function getItemAverageSanity(item: T.Item) {
    const itemMatrix = await (await fetch(`${paths.penguinStatsUrl}/result/matrix?server=US&itemFilter=${item.data.itemId}`)).json();
    const stagesArr = await api.all('stage', { include: ['excel.stageId', 'excel.code', 'excel.apCost'] });

    const dataArr = [];
    for (const datum of itemMatrix.matrix) {
        if (datum.end) continue;
        const stage = stagesArr.find(s => s.length === 1 && s[0].excel.stageId === datum.stageId);
        if (!stage) continue;
        const sanity = stage[0].excel.apCost * datum.times / datum.quantity;
        dataArr.push({ stageId: stage[0].excel.stageId, code: stage[0].excel.code, sanity });
    }

    return dataArr;
}
