import React, {useState, useEffect} from 'react';
import {
    Navbar, Nav, NavDropdown, Form, FormControl, Button,
    Row, Col, Alert,
    Container
} from 'react-bootstrap';
import Promise from 'bluebird';
import { sqlFreeForm, getData } from './api';

function Developer(props) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [timerId, setTimerId] = useState(0);
    
    const pullStatementMsg = () => {
        const tfunc = () => {
            getData('misc/getStatementProcessingMsg').then(msg => {
                setMessage(msg.message);
                console.log('timerid is = '+timerId);
                //if (timerId) {
                    const hndl = setTimeout(tfunc, 100);
                    setTimerId(hndl);
                //}
            });

        };
        const hndl = setTimeout(tfunc, 100);
        console.log('start time=' + hndl);
        setTimerId(hndl);
    }
    const importPayment = who => {
        setMessage('Please wait');
        getData(`misc/statement?who=${who}`).then(res => {
            setMessage('import done');
            setMessage(JSON.stringify(res));
        });
        pullStatementMsg();
    }
    return <Container>
        <Row>
            <Col><Button onClick={() => {
                setMessage('');
                setMessages([]);
            }}>Clear Messages</Button></Col>
        </Row>
        <Row>
            <Col>
                <Alert variant="secondary">{message}</Alert>
            </Col>            
        </Row>
        <Row>
            <Col>
                {
                    messages.map(m => <Alert variant="secondary">{m}</Alert> )
                }                
            </Col>
        </Row>
        <Row>
            <Col><Button onClick={() => {
                if (timerId) {
                    console.log('stop timer ' + timerId);
                    clearTimeout(timerId);
                    setTimerId(0);
                } else {
                    pullStatementMsg();
                }
            }}>{timerId ? 'Stop Timer' : 'Start Timer'}</Button></Col>
        </Row>
        <Row>
            <Col>
                <Button disabled={!!message}  onClick={async () => {
                    await Promise.map([
                        "houseInfo",
                        "ownerInfo",
                        "tenantInfo",
                        "payerTenantMapping",
                        "leaseInfo",
                        "rentPaymentInfo",
                        "leaseTenantInfo"], async name => {
                            setMessage(`deleting ${name}`);
                            const res = await sqlFreeForm(`delete from ${name}`);
                            console.log(res);
                            setMessage(`done delete ${name} affected=${res.affectedRows} changed=${res.changedRows}`)
                    });
                    await sqlFreeForm(`update importPayments set matchedTo=null`);
                }}>Delete All Data</Button>
            </Col>
            <Col>
                <Button disabled={ !!message } onClick={() => {
                    setMessage('Starting imports, please wait');
                    getData('misc/gsimport').then(res => {
                        setMessage('import done');
                        setMessages(res.map(m=>`${m.address} ${m.firstName} ${m.lastName}`))
                    });
                }}>Import Tenants</Button>
            </Col>
        </Row>
        <Row>
            <Col>
                <Button disabled={!!message}  onClick={() => importPayment('paypal')}>Import Paypal</Button>
            </Col>
            <Col>
                <Button disabled={!!message}  onClick={() => importPayment('venmo')}>Import Venmo</Button>
            </Col>
        </Row>
    </Container>
}

export default Developer;