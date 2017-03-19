'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

var SearchNav = require('./views/searchnav.ios');

export default class OnTheWay extends Component {
  render() {
    return (
      <SearchNav/>
    );
  }
}

AppRegistry.registerComponent('OnTheWay', () => OnTheWay);
