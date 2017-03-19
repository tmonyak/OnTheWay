'use strict';

import React, { Component } from 'react';
import {
  Navigator,
  StyleSheet
} from 'react-native';


import Search from './../views/search.ios';

var styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }
});

class SearchNav  extends Component {

    constructor(props) {
        super(props);
    }

    renderScene(route, navigator) {
        if (route.name == 'Search') {
            return <Search navigator={navigator} route={route} {...route.passProps} />
        } else if (route.name == 'Details') {
            return <Details navigator={navigator} route={route} {...route.passProps} />
        }
    }

    configureScene(route, routeStack){
       return Navigator.SceneConfigs.FloatFromBottom
    }

    render() {
       return (
           <Navigator
               initialRoute={{ name: 'Search' }}
               renderScene={this.renderScene}
               configureScene={ this.configureScene }
               style={styles.container}/>
       );
    }
}

module.exports = SearchNav;
