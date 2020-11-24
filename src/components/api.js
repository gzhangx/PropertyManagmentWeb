//import { get } from 'superagent';

const apiBase = 'http://192.168.1.41:8081';
//const apiBase='http://localhost:8081';
const getUrl=path => `${apiBase}/${path}`;
const request = require('superagent');
const get = require('lodash/get');


function doGetOp(url) {
    return request.get(url).send().then(r => get(r, 'body'));
}
function doPostOp(url, data) {
    return request.post(url).send(data).then(r => get(r, 'body'));
}
 
async function getData(sql) {
    return doGetOp(getUrl(sql));
}

async function getModel(name) {
    return doGetOp(`${apiBase}/getModel?name=${name}`);
}

async function sqlGet({table, field, joins, whereArray, order, rowCount, offset}) {
    // "table":"tenantInfo",
    // "field":["tenantID", "firstName"],
    // joins:[{ table:{col:als}}]
    // "order":[{"name":"tenantID", "asc": true}, {"name":"firstName"}]
    return doPostOp(`${apiBase}/sql/get`, {
        table,
        field,
        whereArray,
        joins,
        order,
        rowCount,
        offset,
    })
}

async function sqlAdd(table, fields, create) {
//     "table":"tenantInfo",
//     "fields":{"tenantID":"289a8120-01fd-11eb-8993-ab1bf8206feb", "firstName":"gang", "lastName":"testlong"},
//    "create":true
    //return id
    return doPostOp(`${apiBase}/sql/create`, {
        table,
        fields,
        create,
    })
}


function sqlDelete(table, id) {
    return doPostOp(`${apiBase}/sql/del`, {
        table,id,
    }) 
}

function sqlGetTables() {
    return doGetOp(`${apiBase}/sql/getTables`); 
}

function sqlGetTableInfo(table) {
    return doGetOp(`${apiBase}/sql/getTableInfo?table=${table}`); 
}

function sqlFreeForm(sql, parms) {
    return doPostOp(`${apiBase}/sql/freeFormSql`, {
        sql,
        parms,
    });
}


module.exports = {
    getData,
    getModel,
    sqlGet,
    sqlAdd,
    sqlDelete,
    sqlGetTables,
    sqlGetTableInfo,
    sqlFreeForm,
}
