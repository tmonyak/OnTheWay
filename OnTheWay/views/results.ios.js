'use strict';

import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  ListView,
  View,
  TouchableHighlight,
  Linking
} from 'react-native';

import { Content, Container, Header, InputGroup, Input, Button, Thumbnail, Card, CardItem, Title, Icon, Spinner, Left, Right, Body } from 'native-base';

import DefaultTheme from './../themes/theme';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

var styles = StyleSheet.create({
    list: {
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap'
    },

    item: {
        marginLeft: 20,
        paddingTop: 10
    }

});

class Results extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dataSource: ds.cloneWithRows(this.props.listings),
        }
        for (var i = 0; i<this.props.listings.length; i++) {
            console.log(this.props.listings[i].name);
            console.log(this.props.listings[i].distance);
        }
    }


    render() {
        return (
            <Container>
                <Header style= {{paddingTop: 30, paddingBottom: 15, backgroundColor: '#9b1706'}}>
                <Left>
                    <Button transparent onPress={() => this.props.navigator.pop()}>
                        <Icon name='ios-arrow-back' style={{color:'white'}}/>
                    </Button>
                </Left>
                <Body>
                   <Title style={{color: 'white'}}>Results</Title>
                </Body>
                <Right/>
                </Header>
                <Content>
                <View>
                    <ListView
                     dataSource={this.state.dataSource}
                     enableEmptySections={true}
                     renderRow={(rowData) =>  <View style={styles.item}>
                     <TouchableHighlight onPress={() => Linking.openURL(rowData.url)} >
                    <View>
                    <Text style={{fontSize: 20}}>
                      {rowData.name}
                     </Text>
                     <Text>
                         {rowData.city}
                     </Text>
                     <Text>
                         {rowData.distance}
                     </Text>
                    </View>
                    </TouchableHighlight>
                     </View>}
                     />
                </View>
                </Content>
            </Container>
        );

    }

}

module.exports = Results;
