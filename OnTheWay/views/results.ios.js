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
    },
    separator: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#8E8E8E',
    },

});

class Results extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dataSource: ds.cloneWithRows(this.props.listings),
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
                     renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator} /> }
                     renderRow={(rowData) =>  <View style={styles.item}>
                     <TouchableHighlight
                     onPress={() => Linking.openURL(rowData.url)}
                     underlayColor='gray'>
                    <View style={{paddingLeft: 15, marginBottom: 10, marginTop: 10}}>
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
