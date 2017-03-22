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

var {GooglePlacesAutocomplete} = require('react-native-google-places-autocomplete');
var polyline = require('@mapbox/polyline');

var googleAPIURL = 'https://maps.googleapis.com/maps/api/directions/json?';
var googleAPIKey = 'AIzaSyAfDs-3kqizJ3lMrCsZ5dYZpsAOOZz8dkA';
var googlePlacesAPIKey = 'AIzaSyCijqr9wsl19EnBxdZbJz00zJoyhIMIla8';

var yelpAPIURL = 'https://api.yelp.com/v2/search';
var yelpConsumerKey	= 'nkiyebEprDAa_GC6TT5L5g';
var yelpConsumerSecret = 'XqYls7BGA_GJOKn6I3900CTB1ko';
var yelpToken = '-p9bLMHtgE9a5ARyW6wlDJuejD6egddU';
var yelpTokenSecret = 'eyjhyDOhKPbpqi7tKuv_ZnmuSwA';

var yelpAppID = 'TZCkdTTqoL-_5TA99Xe82A';
var yelpAccessToken = 'P68aCZBr2U3m5xJgy0LqUpo0wqEmGb7toawLPKVHEuFHj0gFvieQ_QumxySy11OJy3WaFPNG6nVbHOB_6OoPCw50XxrWmm37CPhcLguZ_CBIqaNBWh9ayhdOJOrRWHYx';
var yelpTokenType = 'Bearer';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

var styles = StyleSheet.create({
    list: {
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap'
    },

    item: {
        marginLeft: 50,
        paddingTop: 10
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
            dataSource: ds.cloneWithRows([]),
            origin: '',
            destination: ''
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

    search() {
        let origin = null;
        let radius = 3200; //2 miles
        if (this.state.useCurrentLocation == true) {
            origin = this.state.latitude + ',' + this.state.longitude
        } else {
            origin = 'LosAngeles,CA';
        }
        var destination = 'SanFrancisco,CA';
        var googleAPI = googleAPIURL + 'origin=' + origin + '&destination=' + destination + '&key=' + googleAPIKey;

        var oauth = new OAuthSimple(yelpConsumerKey, yelpTokenSecret);
        let lastLatitude = -79.026584;
        let lastLongitude = 68.966806;
        var listings = [];
        fetch(googleAPI)
        .then((response) => response.json())
        .then((result) => {
            var points = polyline.decode(result.routes[0].overview_polyline.points);
            for (var index = 0; index<points.length; index++) {
                var latitude = points[index][0];
                var longitude = points[index][1];
                if (this.distanceBetween(latitude, longitude, lastLatitude, lastLongitude) >= 3200) {
                    lastLatitude = latitude;
                    lastLongitude = longitude;
                    var latlng = "ll=" + String(latitude) + "," + String(longitude);
                    var rad = "&radius_filter=" + radius;
                    fetch("https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=" + String(latitude) + "&longitude=" + String(longitude) + "&limit=1" + "&radius=3200",
                        {
                            method: "GET",
                            headers: {
                                'Authorization': 'Bearer ' + yelpAccessToken,
                            },
                        }
                    )
                    .then((response) => response.json())
                    .then((yelpResult) => {
                        //check if is_closed == True (means closed permanentyl)
                        for(var i = 0; i<yelpResult.businesses.length; i++) {
                            let busLatitude = yelpResult.businesses[i].coordinates.latitude;
                            let busLongitude = yelpResult.businesses[i].coordinates.longitude;
                            let distance = this.distanceBetween(latitude, longitude, busLatitude, busLongitude);
                            console.log(yelpResult.businesses[i].name)
                            console.log(latitude + "," + longitude)

                            listings.push({
                                "pair": latitude + "," + longitude,
                                "name": yelpResult.businesses[i].name,
                                "distance": distance,
                                "city": yelpResult.businesses[i].location.city + ',' + yelpResult.businesses[i].location.state,
                            });
                        }
                    })
                    .then((something) => {
                        this.setState({
                            dataSource: ds.cloneWithRows(listings),
                        })
                    });
                }
            }
        });
        this.setState({
            dataSource: ds.cloneWithRows(listings),
        })
    }

    render () {
        return (
           <Container>
           <Header style= {{paddingTop: 30, backgroundColor: '#5d0dbf'}}>
              <Title style={{color: 'white'}}>Search</Title>
           </Header>

           <Content>

           <GooglePlacesAutocomplete
        placeholder='Start'
        minLength={2} // minimum length of text to search
        autoFocus={false}
        listViewDisplayed='auto'    // true/false/undefined
        fetchDetails={true}
        renderDescription={(row) => row.description} // custom description render
        onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
          this.setState({
              origin: data,
          });
        }}
        getDefaultValue={() => {
          return ''; // text input default value
        }}
        query={{
          // available options: https://developers.google.com/places/web-service/autocomplete
          key: googleAPIKey,
          language: 'en', // language of the results
          types: '(cities)', // default: 'geocode'
        }}
        styles={{
          description: {
            fontWeight: 'bold',
          },
          textInputContainer: {
           backgroundColor: 'rgba(0,0,0,0)',
           borderTopWidth: 0,
           borderBottomWidth:0
         },
          predefinedPlacesDescription: {
            color: '#1faadb',
          },
        }}

        currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
        currentLocationLabel="Current Location"
        nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
        GoogleReverseGeocodingQuery={{
          key: this.googlePlacesAPIKey,
          latlng: this.state.latitude + ',' + this.state.longitude,
        }}
        GooglePlacesSearchQuery={{
          // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
          rankby: 'distance',
          types: 'food',
        }}


        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities

        debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 200ms.
      />
      <GooglePlacesAutocomplete
   placeholder='Destination'
   minLength={2} // minimum length of text to search
   autoFocus={false}
   listViewDisplayed='auto'    // true/false/undefined
   fetchDetails={true}
   renderDescription={(row) => row.description} // custom description render
   onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
       this.setState({
           destination: data,
       });
   }}
   getDefaultValue={() => {
     return ''; // text input default value
   }}
   query={{
     // available options: https://developers.google.com/places/web-service/autocomplete
     key: googleAPIKey,
     language: 'en', // language of the results
     types: '(cities)', // default: 'geocode'
   }}
   styles={{
     description: {
       fontWeight: 'bold',
     },
     textInputContainer: {
      backgroundColor: 'rgba(0,0,0,0)',
      borderTopWidth: 0,
      borderBottomWidth:0
    },
     predefinedPlacesDescription: {
       color: '#1faadb',
     },
   }}

   nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
   GoogleReverseGeocodingQuery={{
     // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
   }}
   GooglePlacesSearchQuery={{
     // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
     rankby: 'distance',
     types: 'food',
   }}


   filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities

   debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 200ms.
 />
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
                <TouchableHighlight onPress={() => Linking.openURL(rowData.url)} >
               <View>
               <Text style={{fontSize: 20}}>
                 {rowData.name}
                </Text>
                <Text>
                    {rowData.city}
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

module.exports = Search;
