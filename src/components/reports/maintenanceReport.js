import React, {useState, useEffect} from 'react';
import moment from 'moment';
import { getMaintenanceReport, getPaymnents } from '../aapi';
import uniq from 'lodash/uniq';
import EditDropdown from '../paymentMatch/EditDropdown';
import { TOTALCOLNAME} from './rootData';
export default function MaintenanceReport(props) {
    const jjctx = props.jjctx;
    console.log(jjctx);
    const { paymentsByMonth, expenseData, calculateExpenseByDate, calculateIncomeByDate} = jjctx;
    const getInitTableData = () => ({
        dateKeys: {},
        monthes: [],
        monthlyTotal: {},
        categorieKeys: {},
        categories: [],
    });

    const [payments, setPayments] = useState([]);


    const [allMonthes, setAllMonthes] = useState([]);
    const [monthes, setMonthes] = useState([]);

    const [curSelection, setCurSelection] = useState({label: ''});
    const [options, setOptions] = useState([]);

    const formatData = (datas,curSelection) => datas.reduce((acc, r) => {
        const month = moment(r.month).add(2,'days').format('YYYY-MM');
        if (curSelection && month < curSelection.label) return acc;
        if (!acc.dateKeys[month]) {
            acc.dateKeys[month] = true;
            acc.monthes.push(month);
        }
        let cats = acc.categorieKeys[r.category];
        if (!cats) {
            cats = { total: 0, order: r.displayOrder };
            acc.categorieKeys[r.category] = cats;
            acc.categories.push(r.category);
        }
        cats[month] = r.amount;
        cats['total'] += r.amount;
        acc.monthlyTotal[month] = (acc.monthlyTotal[month] || 0) + r.amount;
        return acc;
    }, getInitTableData());
    useEffect(() => {

        getPaymnents().then(r => {
            r = r.map(r => {
                return {
                    ...r,
                    date: moment(r.date).format('YYYY-MM-DD'),
                    month: moment(r.date).format('YYYY-MM'),
                }
            }).sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;
                return 0;
            });
            r = r.reduce((acc, r) => {
                if (acc.curMon !== r.month) {
                    acc.curMon = r.month;
                    acc.total = 0;
                }
                acc.total += r.amount;
                r.total = acc.total;
                acc.res.push(r);
                return acc;
            }, {
                    res: [],
                    curMon: null,
                total: 0,
            });
            setPayments(r.res);
        })
    }, []);
    
    //set month selection
    useEffect(() => {
        const monthes = uniq(payments.reduce((acc, p) => {
            if (!acc.founds[p.month]) {
                acc.founds[p.month] = true;
                acc.monthes.push(p.month);
            }
            return acc; 
        }, {
            founds: {},
            monthes: [],
        }).monthes.concat(expenseData.monthes)).sort();
        setAllMonthes(monthes);
        setMonthes(monthes);
        setOptions(monthes.map(label => ({
            label
        })));
    }, [expenseData.originalData, payments])

    //format data
    useEffect(() => {
        setMonthes(allMonthes.filter(m => !curSelection || m >= curSelection.label));
        
        calculateExpenseByDate(expenseData, curSelection);
        calculateIncomeByDate(paymentsByMonth, curSelection);
    }, [expenseData.originalData, payments, curSelection]);

    const fMoneyformat = amt=> {
        if (!amt) return '-';
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          
            // These options are needed to round to whole numbers if that's what you want.
            //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
            //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
        });
        return formatter.format(amt);
    };
    return <>
        <EditDropdown context={{
            disabled: false,
            curSelection, setCurSelection, getCurSelectionText: x=>x.label || '',
            options, setOptions,
            loadOptions: ()=>null,
        }}></EditDropdown>
        <table className='tableReport'>
            <thead>
            
                <th className='tdColumnHeader'></th><th className='tdColumnHeader'>Total</th>
                {
                    monthes.map(mon => {
                        return <th className='tdColumnHeader'>{ mon}</th>
                    })
                }
                
            </thead>
            <tbody><tr>
                <td className='tdLeftSubHeader' colSpan={monthes.length+2}>Income</td></tr>
                <tr><td>
                </td><td >{fMoneyformat(paymentsByMonth[TOTALCOLNAME].total)}</td>
                {
                    monthes.map(name => {
                        const mon = paymentsByMonth[name];
                        if (!mon) return <td></td>;
                        return <td>{ fMoneyformat(mon.total)}</td>
                    })
                }</tr>
                <tr><td className='tdLeftSubHeader' colSpan={monthes.length+2}>Expenses</td></tr>
            
                
                {
                    //expenses
                    [...expenseData.categoryNames].map(cat => {
                        return <tr>
                            <td className='tdLeftSubCategoryHeader'>{cat}</td><td class='tdCenter  tdTotalItalic'>{fMoneyformat(expenseData.categoriesByKey[cat][TOTALCOLNAME])}</td>
                            {
                                monthes.map(mon => {
                                    return <td class='tdCenter'>{fMoneyformat(expenseData.categoriesByKey[cat][mon] || '' )}</td>  
                                })
                            }
                        </tr>
                    })
                    }
                <tr><td className='tdLeftSubCategoryHeader'>Total</td><td class='tdCenter  tdTotalItalic'>{
                    fMoneyformat(expenseData.categoriesByKey[TOTALCOLNAME][TOTALCOLNAME])
                }</td>
                    {
                        monthes.map(mon => {
                            return <td class='tdCenter tdTotalItalic'>{ fMoneyformat((expenseData.monthlyTotal[mon] || 0)) }</td>
                        })
                    }
                </tr>
                <tr>
                    <td colSpan={monthes.length+2}></td>
                </tr>
                <tr>
                    <td className='tdLeftSubHeader tdButtomTotalCell'>Net Income</td>
                    <td class='tdCenter tdTotalBold'>{ fMoneyformat((paymentsByMonth[TOTALCOLNAME].total -expenseData.categoriesByKey[TOTALCOLNAME][TOTALCOLNAME]))}</td>
                    {
                        monthes.map(mon => {
                            const inc = paymentsByMonth[mon] || {};
                            const incTotal = inc.total || 0;
                            const cost = expenseData.monthlyTotal[mon] || 0;
                            return <td className='tdButtomTotalCell tdTotalBold tdCenter t'>{fMoneyformat( (incTotal - cost))}</td>
                        })
                    }
                </tr>
            </tbody>
        </table>
    </>
}