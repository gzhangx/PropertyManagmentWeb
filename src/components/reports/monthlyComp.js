
import React, { useState, useEffect } from 'react';
import { Table, Form, Modal, Dropdown, Button, Toast, InputGroup, Tab } from 'react-bootstrap';
import { sqlGet } from '../api';
import EditDropdown from '../paymentMatch/EditDropdown';

import { orderBy, sumBy } from 'lodash';
import moment from 'moment';

export default function MonthlyComp() {
    const [workers, setWorkers] = useState([]);
    const [workerComps, setWorkerComps] = useState({});
    const [errorTxt, setErrorText] = useState('');
    const [curWorker, setCurWorker] = useState({});
    const [monthes, setMonthes] = useState([]);
    const [curMonth, setCurMonth] = useState({});
    const [payments, setPayments] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [showDetails, setShowDetails] = useState({});
    const workerToOptin = w => ({
        value: w.workerID,
        label: `${w.firstName} ${w.lastName}`,
    });
    //load comp params
    useEffect(() => {
        sqlGet({
            table: 'workerComp',
            //fields: ['workerID', 'firstName', 'lastName'],
            //groupByArray: [{ 'field': 'workerID' }]
        }).then(res => {
            setWorkerComps(res.rows.reduce((acc, wc) => {
                let cmp = acc[wc.workerID];
                if (!cmp) {
                    cmp = [];
                    acc[wc.workerID] = cmp;
                }
                cmp.push(wc);
                return acc;
            }, {}));
            setWorkers(res.rows);
            if (res.rows.length) {
                const w = res.rows[0];
                setCurWorker(workerToOptin(w));
            }
        }).catch(err => {
            
        });       
        
    }, []);
    //load aggregated months
    useEffect(() => {
        if (!curWorker.value) return;
        sqlGet({
            table: 'maintenanceRecords',
            fields: ['month'],
            whereArray: [{
                field: 'workerID',
                op: '=',
                val: curWorker.value,
            }            
        ],
            groupByArray: [{ 'field': 'month' }]
        }).then(res => {
            let rows = res.rows.map(r=>r.month).map(m=>m.substr(0,7));
            rows = orderBy(rows,[x=>x],['desc']);
            const m = rows.map(value => ({
                value,
                label: value,
            }));
            setMonthes(m);
            if (m.length) setCurMonth(m[0]);
        });
    }, [curWorker]);
    
    
    useEffect(() => {
        if (!curWorker?.value) return;
        if (!curMonth?.value) return;
        sqlGet({
            table: 'rentPaymentInfo',
            whereArray:[{field:'workerID', op:'=',val: curWorker.value},{field:'month',op:'=',val:curMonth.value}],
        }).then(res => {
            setPayments(res.rows);
        })

        sqlGet({
            table:'maintenanceRecords',
            whereArray: [{
                field: 'workerID',
                op: '=',
                val: curWorker.value,
            },{field:'month',op:'=',val:curMonth.value}],
        }).then(res=>{
            const rows = orderBy(res.rows,['date']);
            setMaintenanceRecords(rows);
        })
    }, [curMonth.value]);

    const curWorkerComp = orderBy(workerComps[curWorker.value] || [], ['address'], ['asc']);
    const paymentsByLease = payments.reduce((acc, p) => {
        let lp = acc[p.leaseID];
        if (!lp) {
            lp = {
                total: 0,
                payments: [],
            };
            acc[p.leaseID] = lp;
        }
        lp.total += p.receivedAmount;
        lp.payments.push(p);
        return acc;
    }, {});
    const cmpToLease = cmp => paymentsByLease[cmp.leaseID] || { total: 0 };
    const getCmpAmt = cmp => {
        if (cmp.type === 'percent')
            return cmpToLease(cmp).total*cmp.amount/100;
        return cmp.amount;
    }
    
    const totalEarned = sumBy(curWorkerComp.map(getCmpAmt),x=>x);
    const maintenanceRecordsByExpCat = maintenanceRecords.reduce((acc, r)=>{
        let cat = acc.byCat[r.expenseCategoryName];
        if (!cat) {
            cat = {
                id: r.expenseCategoryId,
                name: r.expenseCategoryName,
                reimburse: r.expenseCategoryName !== 'Commission Fee',
                total: 0,
                items: [],                
            };
            acc.byCat[r.expenseCategoryName] = cat;
            acc.cats.push(cat);
        }
        cat.total += r.amount;
        if (cat.reimburse) {
            acc.total += r.amount;
        }
        cat.items.push(r);
        return acc;
    },{
        total: 0,
        byCat: {},
        cats: [],
    });
    maintenanceRecordsByExpCat.cats = orderBy(maintenanceRecordsByExpCat.cats,['expCatDisplayOrder']);
    return <div style={{display:'flex', height:'100%', flexDirection:'column', boxSizing:'border-box'}}>
        <Modal show={!!errorTxt}>
            <Modal.Header closeButton>
                <Modal.Title>Error</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>{errorTxt}</p>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setErrorText('')}>Close</Button>
            </Modal.Footer>
        </Modal>
        <div style={{ display: 'inline-flex', flexShrink:0 }}>
            <div style={{ flex: '1 0 0', order: 1 }}>
                <EditDropdown context={{
                    disabled: false,
                    curSelection: curWorker, setCurSelection: setCurWorker, getCurSelectionText: x => x.label || '',
                    options: workers.map(workerToOptin), setOptions: () => { },
                    loadOptions: () => null,
                }}></EditDropdown>
            </div>
            <div style={{ flexFlow: 'row', flex: '1 0 0', order: 1 }}>
                <EditDropdown context={{
                    disabled: false,
                    curSelection: curMonth, setCurSelection: setCurMonth, getCurSelectionText: x => x.label || '',
                    options: monthes, setOptions: () => { },
                    loadOptions: () => null,
                }}></EditDropdown>
            </div>
        </div>
        
        <div style={{flexGrow:1, overflowY:'auto'}}>
            <Table>
                <thead>
                    <tr><td></td><td>Type</td><td>Address</td>
                    <td>Rent</td><td>Comp</td>
                    </tr>
                </thead>
                <tbody>
                    {
                        curWorkerComp.map((cmp,key) => {
                            const lt = cmpToLease(cmp);
                            return <><tr key={key}><td>{cmp.amount}</td><td>{cmp.type}</td><td>{cmp.address}</td>
                                <td>{lt.total}</td><td>{ getCmpAmt(cmp).toFixed(2)}</td>
                                <td><div style={{cursor:'pointer'}} onClick={()=>{
                                    setShowDetails(state=>{
                                        return {
                                            ...state,
                                            [cmp.leaseID]: !state[cmp.leaseID],
                                        }
                                    });

                                }}>+</div></td>
                            </tr>
                            {
                                showDetails[cmp.leaseID] && lt.payments.map(pmt=>{
                                    return <tr><td>{moment(pmt.receivedDate).format('YYYY-MM-DD')}</td><td>{pmt.paidBy}</td><td>{pmt.notes}</td><td>{pmt.receivedAmount}</td></tr>
                                })
                            }
                            </>
                        })
                    }
                    {
                        <tr><td>Total</td><td></td><td></td>
                            <td>{
                                sumBy(curWorkerComp.map(cmpToLease),'total').toFixed(2)
                            }</td><td>
                                {
                                    totalEarned.toFixed(2)
                                }
                            </td></tr>
                    }
                </tbody>
            </Table>
            <Table>
                <thead>                
                </thead>
                <tbody>
                    {
                        maintenanceRecordsByExpCat.cats.map((mr,key) => {                            
                            return <><tr key={key}>
                                <td style={{textDecoration:mr.reimburse?'none':'line-through'}}>{mr.name}</td><td>{mr.total}</td>
                                <td></td><td></td>
                                <td><div style={{cursor:'pointer'}} onClick={()=>{
                                    setShowDetails(state=>{
                                        return {
                                            ...state,
                                            [mr.id]: !state[mr.id],
                                        }
                                    });

                                }}>+</div></td>
                                </tr>
                                {
                                    showDetails[mr.id] && mr.items.map(itm=><tr><td></td><td>{itm.amount}</td><td>{itm.address}</td><td>{moment(itm.date).format('YYYY-MM-DD')}</td><td>{itm.description}</td></tr>)
                                    
                                }
                                </>
                        })
                    }
                    {
                        <tr><td>Total</td>
                            <td>{
                                maintenanceRecordsByExpCat.total.toFixed(2)
                            }</td>
                            </tr>
                    }
                </tbody>
            </Table>
            <span>
                Total to be paied: {(totalEarned + maintenanceRecordsByExpCat.total).toFixed(2)}
            </span>
        </div>
    </div>
}