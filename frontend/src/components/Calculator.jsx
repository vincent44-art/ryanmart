
import React, { useState } from 'react';

const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEqual = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
      <div className="bg-white rounded shadow-lg p-4" style={{width: '320px'}}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Calculator</h5>
          <button
            onClick={onClose}
            className="btn-close"
            aria-label="Close"
          ></button>
        </div>
        
        <div className="bg-light p-3 rounded mb-3 text-end" style={{minHeight: '60px'}}>
          <div className="h4 mb-0 font-monospace text-truncate" style={{fontSize: '1.8rem'}}>
            {display}
          </div>
        </div>
        
        <div className="row g-2">
          <div className="col-6">
            <button
              onClick={clear}
              className="btn btn-danger w-100 fw-bold"
              style={{height: '50px'}}
            >
              Clear
            </button>
          </div>
          <div className="col-3">
            <button
              onClick={() => performOperation('/')}
              className="btn btn-primary w-100 fw-bold"
              style={{height: '50px'}}
            >
              ÷
            </button>
          </div>
          <div className="col-3">
            <button
              onClick={() => performOperation('*')}
              className="btn btn-primary w-100 fw-bold"
              style={{height: '50px'}}
            >
              ×
            </button>
          </div>
          
          {[7, 8, 9].map(num => (
            <div className="col-3" key={num}>
              <button
                onClick={() => inputNumber(num)}
                className="btn btn-light w-100 fw-bold border"
                style={{height: '50px'}}
              >
                {num}
              </button>
            </div>
          ))}
          <div className="col-3">
            <button
              onClick={() => performOperation('-')}
              className="btn btn-primary w-100 fw-bold"
              style={{height: '50px'}}
            >
              -
            </button>
          </div>
          
          {[4, 5, 6].map(num => (
            <div className="col-3" key={num}>
              <button
                onClick={() => inputNumber(num)}
                className="btn btn-light w-100 fw-bold border"
                style={{height: '50px'}}
              >
                {num}
              </button>
            </div>
          ))}
          <div className="col-3">
            <button
              onClick={() => performOperation('+')}
              className="btn btn-primary w-100 fw-bold"
              style={{height: '50px'}}
            >
              +
            </button>
          </div>
          
          {[1, 2, 3].map(num => (
            <div className="col-3" key={num}>
              <button
                onClick={() => inputNumber(num)}
                className="btn btn-light w-100 fw-bold border"
                style={{height: '50px'}}
              >
                {num}
              </button>
            </div>
          ))}
          <div className="col-3 d-flex flex-column">
            <button
              onClick={handleEqual}
              className="btn btn-success w-100 fw-bold flex-grow-1"
              style={{height: '102px'}}
            >
              =
            </button>
          </div>
          
          <div className="col-6">
            <button
              onClick={() => inputNumber(0)}
              className="btn btn-light w-100 fw-bold border"
              style={{height: '50px'}}
            >
              0
            </button>
          </div>
          <div className="col-3">
            <button
              onClick={inputDecimal}
              className="btn btn-light w-100 fw-bold border"
              style={{height: '50px'}}
            >
              .
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
