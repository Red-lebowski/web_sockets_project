import React from 'react';
import ReactDOM from 'react-dom';
import './styles/tailwind.css';

import CurrentSecond from "./components/CurrentSecond";

ReactDOM.render(
  <React.StrictMode>
    <CurrentSecond/>
  </React.StrictMode>,
  document.getElementById('root')
);