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

var googleMatrixAPIURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=';
var googlePlacesSearchAPIURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=';
var googlePlaceAPIURL = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=';

import {keys} from './../config';
var yelpKey = keys.yelpKey;
var googleKey = keys.googleKey;

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

    addUrls(_listings) {
        var promises = [];
        var sortedListings = [];
        for (var j = 0; j < _listings.length; j++) {
            var googlePlaceAPI = googlePlaceAPIURL + _listings[j].place_id + "&key=" + googleKey;
            console.log(googlePlaceAPI)
            promises.push(fetch(googlePlaceAPI));
        }
        return new Promise(function(resolve, reject) {
            Promise.all(promises)
            .then((responses) => {
                for (var k = 0; k<responses.length; k++) {
                    var response = JSON.parse(responses[k]._bodyInit);
                    console.log(response);
                    _listings[k].url = response.result.url;

                }
            })
            .done();
        });
    }

    addDistances(_listings) {
        var promises = [];
        var sortedListings = [];
        for (var j = 0; j < _listings.length; j++) {
            var googleMatrixAPI = googleMatrixAPIURL + this.state.latitude + "," + this.state.longitude + "&destinations=" + _listings[j].latitude + "," + _listings[j].longitude + "&key=" + googleKey;
            promises.push(fetch(googleMatrixAPI));
        }
        return new Promise(function(resolve, reject) {
            Promise.all(promises)
            .then((matrixResponses) => {
                for (var k = 0; k<matrixResponses.length; k++) {
                    var matrixResult = JSON.parse(matrixResponses[k]._bodyInit);
                    _listings[k].distance = matrixResult.rows[0].elements[0].duration.text + " away";
                    _listings[k].seconds = matrixResult.rows[0].elements[0].duration.value;
                    binaryInsert(_listings[k], sortedListings, 0, sortedListings.length - 1);

                }
            })
            .done(() => {
                resolve(sortedListings);
            });
        });
    }

    getPlaces(_polyline) {
        let lastLatitude = -79.026584;
        let lastLongitude = 68.966806;
        let radius = 2400; //1.5 miles
        let limit = 1;
        let listings = {};
        var promises = [];
        var points = polyline.decode(_polyline);
        for (var index = 0; index<points.length; index++) {
            var latitude = points[index][0];
            var longitude = points[index][1];
            if (this.distanceBetween(latitude, longitude, lastLatitude, lastLongitude) >= radius) {
                lastLatitude = latitude;
                lastLongitude = longitude;
                //add open at parameter to check if it'll be open when you get there
                let googlePlacesSearchRequest = googlePlacesSearchAPIURL + String(latitude) + "," + String(longitude) + "&radius=2400&type=restaurant&key=" + googleKey;
                promises.push(
                    fetch(googlePlacesSearchRequest)
                );
            }
        }
        return new Promise(function(resolve, reject) {
            Promise.all(promises)
            .then((responses) => {
                var matrixPromises = [];
                for (var j = 0; j < responses.length; j++) {
                    var place = JSON.parse(responses[j]._bodyInit);
                    let searchLimit = place.results.length == 0 ? 0 : limit;
                    for(var i = 0; i<searchLimit; i++) {
                        if (place.results[i].place_id in listings) { //check if permanently closed
                            continue;
                        }
                        let newListing = {
                            "name": place.results[i].name,
                            "latitude": place.results[i].geometry.location.lat,
                            "longitude": place.results[i].geometry.location.lng,
                            "rating": "Rating: " + place.results[i].rating,
                            "price": place.results[i].price_level,
                            "types": place.results[i].types,
                            "placeid": place.results[i].place_id,
                        }
                        switch(place.results[i].price_level) {
                            case 0:
                                newListing.price = "Price: $";
                                break;
                            case 1:
                                newListing.price = "Price: $$";
                                break;
                            case 2:
                                newListing.price = "Price: $$$";
                                break;
                            case 3:
                                newListing.price = "Price: $$$$";
                                break;
                            case 4:
                                newListing.price = "Price: $$$$$";
                                break;
                            default:
                                newListing.price = "Price: Unknown";
                                break;
                        }
                        listings[place.results[i].place_id] = newListing;
                    }
                }
            })
            .done(() => {
                var results = [];
                for (var id in listings) {
                    results.push(listings[id]);
                }
                resolve(results);
            });
        });
    }

    async showResults(_polyline) {
        try {
            let places = await this.getPlaces(_polyline);
            let listings = await this.addDistances(places);
            //await this.addUrls(listings);
            this.props.navigator.push({
                name: 'Results',
                passProps: {
                    listings: listings
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
