import XMapperService from '../XMapperService'

import { AppContainer } from 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';
import Trainer from './trainer';
import Mapper from './mapper'


const rootEl = document.getElementById('root');
const render = Component =>
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    rootEl
  );

render(~window.location.href.indexOf('mapper') ? Mapper : Trainer );

if (module.hot) {
  module.hot.accept('./trainer', () => !~window.location.href.indexOf('mapper') && render(Trainer))
  module.hot.accept('./mapper', () => ~window.location.href.indexOf('mapper') && render(Mapper))
}