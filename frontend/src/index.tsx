import React from 'react';
import ReactDOM from 'react-dom';
import './styles/tailwind.css';

import CurrentSecond from "./components/CurrentSecond";
import Playground from './components/Playground';

ReactDOM.render(
  <React.StrictMode>
    <CurrentSecond/>
    {/* <Playground /> */}
  </React.StrictMode>,
  document.getElementById('root')
);