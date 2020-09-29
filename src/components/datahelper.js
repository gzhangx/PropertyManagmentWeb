import {getModel,sqlGet,sqlAdd,sqlDelete} from './api';
import mod from './models';

export function createHelper(table) {
    const accModel=() => mod.models[table];
    const accModelFields=() => accModel().fields;
    return {
        getModelFields: accModelFields,
        loadModel: async name => {
            if(!accModel()) {
                mod.models[table]=await getModel('tenantInfo');
            }
            return accModel();
        },
        loadData: async fields => {
            //fields: array of field names
            return sqlGet(table,fields||accModelFields().map(f => f.field))
        },
        saveData: async (data,id) => {
            const submitData=accModelFields().reduce((acc,f) => {
                acc[f.field]=data[f.field];
                return acc;
            },{});
            return sqlAdd(table,submitData,!id);
        },
        deleteData: async id => sqlDelete(table,id),
    }
}
