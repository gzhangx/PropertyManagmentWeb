import React, { useState, useEffect } from 'react';
import { Modal, Container, Row, Col, Tabs, Tab, Form, DropdownButton, Dropdown, Button, Toast, InputGroup, ButtonGroup } from 'react-bootstrap';


import { GetOrCreate } from './GetOrCreate';

import { sqlFreeForm } from '../api';
import {
    saveTenantProcessorPayeeMapping,
    getHouses,
} from '../aapi';
import { nameToFirstLast } from '../util';
import { add, get, set } from 'lodash';
import GenCrudAdd from '../GenCrudAdd';
import { createHelper } from '../datahelper';
import { getFKDefs } from '../GenCrudTableFkTrans';

function AddNewDlgFunc(props) {
    const { curModalInfo,
         setShowProgress, setCurModalInfo } = props.context;
    const { table, editItem, setCurrSelection } = curModalInfo;
    const [columnInfo, setColumnInfo] = useState([]);
    
    const helper = createHelper(table);    
    useEffect(() => {
        if (helper) helper.loadModel().then(() => {
            const columnInfo = helper.getModelFields();
            setColumnInfo(columnInfo);
        });
    }, [table]);    
    if (!table) return <></>;
    return <GenCrudAdd table={table} columnInfo={columnInfo} show
        editItem={editItem}
        fkDefs={getFKDefs()}
        doAdd={
            (data, id) => {
                return helper.saveData(data, id).then(res => {
                    return res;
                }).catch(err => {
                    console.log(err);
                    setShowProgress(err.message);
                })
            }
        }
        onOK={added => {
            if (added) {
                setCurrSelection(added);                
            }
            //setIsCreateNew(false);
            setCurModalInfo({});
        }}
    ></GenCrudAdd>
}
export function TenantMatcher(props) {

    const { onClose, name, source } = props.context;
    const show = !!name;
    //const { show } = props;
    const [curTenantSelection, setCurTenantSelection] = useState({});
    const [curHouseSelection, setCurHouseSelection] = useState({});
    const [showProgress, setShowProgress] = useState(false);
    const firstLast = nameToFirstLast(name || '');
    const [tenantName, setTenantName] = useState(firstLast.firstName);
    const getHouseLabel = h => `${r.address} ${r.city} ${r.state}`;
    useEffect(() => {
        setTenantName({
            firstName: firstLast.firstName || '',
            lastName: firstLast.lastName || '',
        });
    }, [firstLast.firstName, firstLast.lastName]);
    const loadTenantOptions = async (name = '') => {
        const { firstName, lastName } = nameToFirstLast(name || '');
        const res = await sqlFreeForm(`select tenantID, firstName, lastName from tenantInfo 
        where firstName like ? or lastName like ?`, [`%${firstName}%`, `%${lastName}%`]);
        const fm = res.map(r => ({
            label: `${r.firstName} ${r.lastName}`,
            value: r,
        }));
        return fm;
    };
    const loadHouseOptions = async (address = '') => {        
        const res = await getHouses(address);
        const fm = res.map(r => ({
            label: getHouseLabel(r),
            value: r,
        }));
        return fm;
    };

    const tenantID = get(curTenantSelection, 'value.tenantID');
    const mapToLabel = curTenantSelection.label;
    

    const createNewStyle = { fontSize: '9px' };    

    const [curModalInfo, setCurModalInfo] = useState({});
    const addNewBaseProps = {
        curModalInfo, setCurModalInfo,
        setShowProgress
    };
    return <div >
        <Modal show={!!showProgress}>
            <Container>
                {showProgress}
            </Container>
        </Modal>
        <AddNewDlgFunc context={{
            ...addNewBaseProps,
        }}></AddNewDlgFunc>        
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton onClick={() => {
                onClose();
            }}>
                <Modal.Title id="contained-modal-title-vcenter">
                    Matching name {name}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="show-grid">
                <Container>                    
                        <Row><Col>Ma: {mapToLabel} to {name} {source} {tenantID}</Col></Row>
                        <Row>
                        <Col xs={8} md={8}>
                                    <GetOrCreate context={{
                                        curSelection: curTenantSelection, setCurSelection: setCurTenantSelection,
                                        loadOptions: loadTenantOptions,
                                    }}></GetOrCreate>                                    
                        </Col>
                        <Col >
                            <Button size="sm" style={createNewStyle} onClick={() => {
                                //setIsCreateNew(true);
                                setCurModalInfo({
                                    table: 'tenantInfo',
                                    editItem: tenantName,
                                    setCurSelection: added => {
                                        setCurTenantSelection({
                                            label: `${added.firstName} ${added.lastName}`,
                                            value: {
                                                tenantID: added.id,
                                            }
                                        })
                                    }
                                })
                            }}>Create New Tenant</Button>
                        </Col>                                
                    </Row>
                    <Row>
                        <Col>
                            <Button disabled={!!showProgress} onClick={() => {
                                if (!tenantID) {
                                    setShowProgress('Please select a tenant to map to');
                                    setTimeout(() => setShowProgress(''), 2000);
                                    return;
                                }
                                setShowProgress('Please Wait');
                                saveTenantProcessorPayeeMapping({ tenantID, name, source })
                                    .then(() => {
                                        setShowProgress('');
                                    }).catch(err => {
                                        setShowProgress(err.message);
                                    });
                            }}>Link</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={8} md={8}>
                            <GetOrCreate context={{
                                curSelection: curHouseSelection, setCurSelection: setCurHouseSelection,
                                loadOptions: loadHouseOptions,
                            }}></GetOrCreate>
                        </Col>
                        <Col>
                            <Button disabled={!!showProgress} style={createNewStyle} onClick={() => {                                
                                setCurModalInfo({
                                    table: 'houseInfo',
                                    setCurrSelection: added => {
                                        setCurHouseSelection({
                                            label: getHouseLabel,
                                            value:r,
                                        })
                                    }
                                })
                            }}>Create New House</Button>
                        </Col>
                    </Row>
                    <Row>                        
                        <Col>
                            <Button disabled={!!showProgress} onClick={() => {
                                if (!tenantID) {
                                    setShowProgress('Please select a tenant to map to');
                                    setTimeout(() => setShowProgress(''), 2000);
                                    return;
                                }
                                setShowProgress('Please Wait');
                                saveTenantProcessorPayeeMapping({ tenantID, name, source })
                                    .then(() => {
                                        setShowProgress('');
                                    }).catch(err => {
                                        setShowProgress(err.message);
                                    });
                            }}>Link</Button>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button  onClick={
                    () => {
                        onClose();
                    }
                }>Close</Button>
            </Modal.Footer>
        </Modal>        
    </div>

}