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

import { Content, Container, Header, InputGroup, Input, Icon, Button, Thumbnail, Card, CardItem, Title, Spinner } from 'native-base';

import OAuthSimple from 'oauthsimple';

import DefaultTheme from './../themes/theme';

var googleAPIURL = 'https://maps.googleapis.com/maps/api/directions/json?';
var googleAPIKey = 'AIzaSyAfDs-3kqizJ3lMrCsZ5dYZpsAOOZz8dkA';

var yelpAPIURL = 'https://api.yelp.com/v2/search';
var yelpConsumerKey	= 'nkiyebEprDAa_GC6TT5L5g';
var yelpConsumerSecret = 'XqYls7BGA_GJOKn6I3900CTB1ko';
var yelpToken = '-p9bLMHtgE9a5ARyW6wlDJuejD6egddU';
var yelpTokenSecret = 'eyjhyDOhKPbpqi7tKuv_ZnmuSwA';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

var styles = StyleSheet.create({
    list: {
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap'
    },

    item: {
        margin: 5,
        width: 170,
        height: 170,
      alignItems:'center'
    }

});

class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            results: null,
            useCurrentLocation: false,
            dataSource: ds.cloneWithRows([])
        }
    }

    componentDidMount() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.setState ({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                });
            },
            (error) => null,
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    search() {
        let origin = null
        if (this.state.useCurrentLocation == true) {
            origin = this.state.latitude + ',' + this.state.longitude
        } else {
            origin = 'Los Angeles,CA';
        }
        var destination = 'San Diego,CA';
        var googleAPI = googleAPIURL + 'origin=' + origin + '&destination=' + destination + '&key=' + googleAPIKey;

        var oauth = new OAuthSimple(yelpConsumerKey, yelpTokenSecret);

        fetch(googleAPI)
        .then((response) => response.json())
        .then((result) => {
            alert(result)
            alert(googleAPI)
            this.setState({
                dataSource: ds.cloneWithRows(result.routes),
            })
            /*var yelpRequest = oauth.sign({
                action: "GET",
                path: yelpAPIURL,
                parameters: "term=coffee&" + 'll=' + origin,
                signatures: {api_key: yelpConsumerKey, shared_secret: yelpConsumerSecret, access_token: yelpToken,
                access_secret: yelpTokenSecret},
            });
            fetch(yelpRequest.signed_url, {method: "GET"})
            .then((response) => response.json())
            .then((result) => {
            });*/
        });
    }

    render () {
        return (
           <Container>
           <Header style= {{paddingTop: 30, backgroundColor: '#5d0dbf'}}>
              <Title style={{color: 'white'}}>Search</Title>
           </Header>

           <Content>

           <InputGroup>
               <Input placeholder="Start" />
           </InputGroup>
           <InputGroup style={{marginBottom: 10}}>
               <Input placeholder="Destination" />
           </InputGroup>
           <Button block
           onPress = {() => this.search()}
           style={{backgroundColor: '#5d0dbf', marginRight: 10, marginLeft: 10}}>
               <Text style={{color: 'white', fontSize: 18}}> Find Stuff </Text>
           </Button>
           <View>
               <ListView
                dataSource={this.state.dataSource}
                enableEmptySections={true}
                renderRow={(rowData) =>  <View style={styles.item}>
               <View>
               <Text>
                 {rowData.name}
                </Text>
               </View>
                </View>}
                />
           </View>

           </Content>
       </Container>
        );
    }
}

module.exports = Search;
