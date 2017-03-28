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


var polyline = require('@mapbox/polyline');

var yelpAppID = 'TZCkdTTqoL-_5TA99Xe82A';
var yelpAccessToken = 'P68aCZBr2U3m5xJgy0LqUpo0wqEmGb7toawLPKVHEuFHj0gFvieQ_QumxySy11OJy3WaFPNG6nVbHOB_6OoPCw50XxrWmm37CPhcLguZ_CBIqaNBWh9ayhdOJOrRWHYx';
var yelpTokenType = 'Bearer';

var googleMatrixAPIKey = 'AIzaSyB4AwHliJnJ98gxgAhtvS18D5Km1brqXeE';
var googleMatrixAPIURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

var styles = StyleSheet.create({
    list: {
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    item: {
        marginLeft: 0,
    },

    separator: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#8E8E8E',
    },

});

function binaryInsert(newElement, array, startVal, endVal){
    var length = array.length;
    var start = typeof(startVal) != 'undefined' ? startVal : 0;
    var end = typeof(endVal) != 'undefined' ? endVal : length - 1;//!! endVal could be 0 don't use || syntax
    var m = start + Math.floor((end - start)/2);

    if(length == 0){
        array.push(newElement);
        return;
    }
    if(newElement.seconds > array[end].seconds){
        array.splice(end + 1, 0, newElement);
        return;
    }
    if(newElement.seconds < array[start].seconds){//!!
        array.splice(start, 0, newElement);
        return;
    }
    if(start >= end){
        return;
    }
    if(newElement.seconds < array[m].seconds){
        binaryInsert(newElement, array, start, m - 1);
        return;
    }
    if(newElement.seconds >= array[m].seconds){
        binaryInsert(newElement, array, m + 1, end);
        return;
    }
}

class ChooseRoute extends Component {

    constructor(props) {
        super(props);
        this.state = {
            longitude: this.props.longitude,
            latitude: this.props.latitude,
            dataSource: ds.cloneWithRows(this.props.googleDirections.routes),
        }
    }

    distanceBetween(thisLatitude, thisLongitude, otherLatitude, otherLongitude) {
        var R = 6371000; // meters
        var phi1 = thisLatitude * (Math.PI / 180);
        var phi2 = otherLatitude * (Math.PI / 180);
        var deltaPhi = (otherLatitude-thisLatitude) * (Math.PI / 180);
        var deltaLambda = (otherLongitude-thisLongitude) * (Math.PI / 180);

        var a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c);
    }

    getGoogleDistances(_yelpListings) {
        var matrixPromises = [];
        var sortedListings = [];
        for (var j = 0; j < _yelpListings.length; j++) {
            var googleMatrixAPI = googleMatrixAPIURL + this.state.latitude + "," + this.state.longitude + "&destinations=" + _yelpListings[j].latitude + "," + _yelpListings[j].longitude + "&key=" + googleMatrixAPIKey;
            matrixPromises.push(fetch(googleMatrixAPI));
        }
        return new Promise(function(resolve, reject) {
            Promise.all(matrixPromises)
            .then((matrixResponses) => {
                for (var k = 0; k<matrixResponses.length; k++) {
                    var matrixResult = JSON.parse(matrixResponses[k]._bodyInit);
                    _yelpListings[k].distance = matrixResult.rows[0].elements[0].duration.text + " away";
                    _yelpListings[k].seconds = matrixResult.rows[0].elements[0].duration.value;
                    binaryInsert(_yelpListings[k], sortedListings, 0, sortedListings.length - 1);

                }
            })
            .done(() => {
                resolve(sortedListings);
            });
        });
    }

    getYelpListings(_polyline) {
        let lastLatitude = -79.026584;
        let lastLongitude = 68.966806;
        let radius = 3200; //2 miles
        let listings = [];
        var promises = [];
        var points = polyline.decode(_polyline);
        for (var index = 0; index<points.length; index++) {
            var latitude = points[index][0];
            var longitude = points[index][1];
            if (this.distanceBetween(latitude, longitude, lastLatitude, lastLongitude) >= 6400) {
                lastLatitude = latitude;
                lastLongitude = longitude;
                var latlng = "ll=" + String(latitude) + "," + String(longitude);
                var rad = "&radius_filter=" + radius;
                //add open at parameter to check if it'll be open when you get there
                promises.push(
                fetch("https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=" + String(latitude) + "&longitude=" + String(longitude) + "&limit=1" + "&radius=3200",
                    {
                        method: "GET",
                        headers: {
                            'Authorization': 'Bearer ' + yelpAccessToken,
                        },
                    }
                ));
            }
        }
        return new Promise(function(resolve, reject) {
            Promise.all(promises)
            .then((responses) => {
                var matrixPromises = [];
                for (var j = 0; j < responses.length; j++) {
                    var yelpResult = JSON.parse(responses[j]._bodyInit);
                    for(var i = 0; i<yelpResult.businesses.length; i++) {
                        if (yelpResult.businesses[i].is_closed == true) {
                            continue;
                        }
                        let newListing = {
                            "name": yelpResult.businesses[i].name,
                            "city": yelpResult.businesses[i].location.city + ', ' + yelpResult.businesses[i].location.state,
                            "url": yelpResult.businesses[i].url,
                            "latitude": yelpResult.businesses[i].coordinates.latitude,
                            "longitude": yelpResult.businesses[i].coordinates.longitude,
                            "categories": yelpResult.businesses[i].categories,
                            "rating": yelpResult.businesses[i].rating,
                        }
                        listings.push(newListing);
                    }
                }
            })
            .done(() => {
                resolve(listings);
            });
        });
    }

    async showResults(_polyline) {
        try {
            let yelpListings = await this.getYelpListings(_polyline);
            let finalListings = await this.getGoogleDistances(yelpListings);
            this.props.navigator.push({
                name: 'Results',
                passProps: {
                    listings: yelpListings
                }
            })

        } catch (err) {
            console.log(err)
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
                   <Title style={{color: 'white'}}>Select Route</Title>
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
                     onPress={() => this.showResults(rowData.overview_polyline.points)}
                     underlayColor='gray'>
                    <View style={{paddingLeft: 15, marginBottom: 15, marginTop: 15}}>
                    <Text style={{fontSize: 25}}>
                      {rowData.summary}
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

module.exports = ChooseRoute;
