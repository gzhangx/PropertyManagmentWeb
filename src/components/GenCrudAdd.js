import React, { useState, useEffect } from 'react';
import { createAndLoadHelper } from './datahelper';
import { Button, Form, Modal, Container, Row, Col } from 'react-bootstrap';
import get from 'lodash/get';
import EditDropdown from './paymentMatch/EditDropdown';
import Promise from 'bluebird';
const GenCrudAdd=(props) => {

    const { columnInfo, doAdd, onCancel,
        editItem, //only available during edit
        onError,
        customSelData,
        customFields = {},
        show,
        table,
        desc,
        fkDefs,
    }
        = props;
    const getForeignKeyProcessor = fk => get(fkDefs, [fk, 'processForeignKey']);
    let id = '';
    let idName = '';
    const addUpdateLabel = editItem ? 'Update' : 'Add';
    const onOK = props.onOK || onCancel;
    const internalCancel = () => onOK();
    const initData=columnInfo.reduce((acc, col) => {
        acc[col.field]='';
        if (editItem) {
            const val=editItem[col.field];
            acc[col.field]=val===0? 0:val||'';
            if (col.isId) {
                id = val;            
            }
        }
        if (col.isId) {         
            idName = col.field;
        }
        return acc;
    }, {});
    const requiredFields = columnInfo.filter(c => c.required && !c.isId).map(c => c.field);
    const requiredFieldsMap = requiredFields.reduce((acc, f) => {
        acc[f] = true;
        return acc;
    }, {});

    const [data, setData] = useState(initData);
    const [errorText, setErrorText] = useState('');
    const [addNewForField, setAddNewForField] = useState('');
    const [optsData, setOptsData] = useState(customSelData || {});
    const handleChange=e => {
        const { name, value }=e.target;
        setData({ ...data, [name]: value });
    }

    const handleSubmit=async e => {
        e.preventDefault();

        const missed=requiredFields.filter(r => !data[r]);
        if (missed.length === 0) {
            const ret = await doAdd(data, id);
            //handleChange(e, ret);          
            const fid = id || ret.id;
            onOK({                
                ...data,
                [idName]: fid,
                id: fid,
            });
        } else {
            if (onError) {
                onError({
                    message: `missing required fields ${missed.length}`,
                    missed,
                });
            }
            return;
        }        
    }

    const optsDataReqSent={

    }

    useEffect(() => {
        async function doLoads() {
            let cur=optsData;;
            for (let i=0; i<columnInfo.length; i++) {
                const c=columnInfo[i];
                if (c.foreignKey) {
                    const optKey=c.foreignKey.table;

                    const processForeignKey = getForeignKeyProcessor(optKey);
                    if (processForeignKey && !optsData[optKey]) {
                        const helper = await createAndLoadHelper(optKey);
                        //await helper.loadModel();
                        const optDataOrig=await helper.loadData();
                        const optData = optDataOrig.rows;
                        cur=Object.assign({}, cur, {
                            [optKey]: processForeignKey(c.foreignKey, optData)
                        });
                    }
                }
            }

            setOptsData(cur);
            
        }
        doLoads();
    }, [table, columnInfo]);

    useEffect(() => {
        setData(initData);
    },[JSON.stringify(initData)])
    const [columnInfoMaps, setColumnInfoMaps] = useState({});
    const loadColumnInfo = async colInf=> {
        const hasFks = colInf.filter(c => c.foreignKey).filter(c => c.foreignKey.table);
        await Promise.map(hasFks, async fk => {
            const tbl = fk.foreignKey.table;
            const helper = await createAndLoadHelper(tbl);
            await helper.loadModel();
            const columnInfo = helper.getModelFields();
            setColumnInfoMaps(prev => {
                return {
                    ...prev,
                    [tbl]: {
                        helper,
                        columnInfo,
                    }
                };
            });
        })
    }
    useEffect(() => {
        loadColumnInfo(columnInfo);
    }, [columnInfo]);
    const checkErrorInd = c => {
        if (requiredFieldsMap[c.field] && !data[c.field])
            return "alert-danger";
        return '';
    }
    return (
        <Modal show={show} onHide={internalCancel} backdrop='static'>
            <Modal.Header closeButton>
                <Modal.Title>{desc}</Modal.Title>
            </Modal.Header>
            <Container>
                <Modal show={!!errorText} onHide={() => {
                    setErrorText('');
                }}>
                    <Modal.Header closeButton>
                        <Modal.Title>{errorText}</Modal.Title>
                    </Modal.Header>
                    <Container>
                    </Container>
                </Modal>
                {
                    columnInfo.filter(c => c.foreignKey).filter(c => c.foreignKey.table && columnInfoMaps[c.foreignKey.table]).map((c, cind) => { 
                        const thisTbl = c.foreignKey.table;
                        const processForeignKey = getForeignKeyProcessor(thisTbl);
                        if (!processForeignKey) return;
                        const { helper, columnInfo } = columnInfoMaps[thisTbl];
                        const doAdd = (data, id) => {
                            return helper.saveData(data, id).then(res => {                                                            
                                return res;
                            }).catch(err => { 
                                console.log(err);
                                setErrorText(err.message);
                            });
                        }
                        const addDone = async added => {                        
                            if (!added) {
                                setAddNewForField('');  
                                return setErrorText('Cancelled');
                            }
                            const optDataOrig = await columnInfoMaps[thisTbl].helper.loadData();
                            const optData = optDataOrig.rows;
                            setOptsData(prev => {
                                return {
                                    ...prev,
                                    [thisTbl]: processForeignKey(c.foreignKey, optData)
                                }
                            });
                            setData(prev => {
                                return {
                                    ...prev,
                                    [c.field]: added.id,
                                }
                            })
                            setAddNewForField('');                            
                        }
                        return <GenCrudAdd key={cind} columnInfo={columnInfo} doAdd={doAdd} onCancel={addDone} show={addNewForField===c.field}></GenCrudAdd>
                    }).filter(x=>x)
                }
            {
                columnInfo.map( ( c, cind ) => {
                    if(!editItem) {
                        if(c.isId) return null;
                    }                    

                    const createSelection=( optName, colField ) => {                        
                        const selOptions = optsData[ optName ];
                        if (!selOptions) return null;
                        const options = selOptions.concat({
                            label: 'Add New',
                            value: 'AddNew',
                        })
                        const curSelection = options.filter( o => o.value===get( data, colField ) )[ 0 ]||{};                        
                        return <>
                            <EditDropdown context={{
                                curSelection,
                                setCurSelection: s => {
                                    if (s.value === 'AddNew') {
                                        setAddNewForField(colField);
                                    }else 
                                    setData({ ...data, [colField]: s.value });
                                },
                                 getCurSelectionText:o=>o.label || '',
                                options, setOptions:null,
                                loadOptions:()=>[],
                            }}></EditDropdown>
                            </>
                    };
                    let foreignSel=null;
                    if (c.foreignKey) {
                        const optKey = c.foreignKey.table;
                        foreignSel=createSelection( optKey, c.field );
                    }
                    const custFieldType=customFields[ c.field ];
                    if ( custFieldType==='custom_select' ) {
                        foreignSel=createSelection( c.field, c.field );
                    }
                    const fieldFormatter=c.dspFunc||(x => x);
                    return <Row key={cind}>
                        <Col>{c.desc}</Col>
                        <Col className={checkErrorInd(c)}>
                            {
                            foreignSel ||< Form.Control as="input" value={fieldFormatter(data[c.field])} name={c.field} onChange={handleChange} />                        
                            }                            
                        </Col>
                        <Col xs={1} className={checkErrorInd(c)}>{checkErrorInd(c) && '*'}</Col>
                    </Row>
                })
                }
                <Modal.Footer>
                <Row>
                    <Col>
                            <Button className="btn-primary" type="submit" onClick={handleSubmit} >{ addUpdateLabel}</Button>
                    </Col>
                    <Col>
                            <Button className="btn-secondary" onClick={internalCancel} >Cancel</Button>
                    </Col>
                    </Row>
                </Modal.Footer>
            </Container>
        </Modal>
    )
}

export default GenCrudAdd;