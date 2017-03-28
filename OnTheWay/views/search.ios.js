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

import DefaultTheme from './../themes/theme';

var {GooglePlacesAutocomplete} = require('react-native-google-places-autocomplete');
var polyline = require('@mapbox/polyline');

var googleAPIURL = 'https://maps.googleapis.com/maps/api/directions/json?';
var googleAPIKey = 'AIzaSyAfDs-3kqizJ3lMrCsZ5dYZpsAOOZz8dkA';
var googlePlacesAPIKey = 'AIzaSyCijqr9wsl19EnBxdZbJz00zJoyhIMIla8';
var googleMatrixAPIKey = 'AIzaSyB4AwHliJnJ98gxgAhtvS18D5Km1brqXeE';
var googleMatrixAPIURL = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=';

var yelpAppID = 'TZCkdTTqoL-_5TA99Xe82A';
var yelpAccessToken = 'P68aCZBr2U3m5xJgy0LqUpo0wqEmGb7toawLPKVHEuFHj0gFvieQ_QumxySy11OJy3WaFPNG6nVbHOB_6OoPCw50XxrWmm37CPhcLguZ_CBIqaNBWh9ayhdOJOrRWHYx';
var yelpTokenType = 'Bearer';

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

class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            useCurrentLocation: false,
            origin: '',
            destination: '',
            currentLocation: null
        }
    }

    componentDidMount() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.setState ({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                currentLocation: {description: 'Current Location', geometry: { location: { lat: position.coords.latitude, lng: position.coords.longitude } }},
                });
                this.render();
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

    showResults(_listings) {
        this.props.navigator.push({
            name: 'Results',
            passProps: {
                listings: _listings,
            }
        })
    }

    /*chooseRoute(_googleMapsResponse) {
        this.props.navigator.push({
            name: 'ChooseRoute',
            passProps: {
                googleMapsJson: _googleMapsResponse,
            }
        })
    }*/

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

    getYelpListings(_googleDirections) {
        let lastLatitude = -79.026584;
        let lastLongitude = 68.966806;
        let radius = 3200; //2 miles
        let listings = [];
        var promises = [];
        var points = polyline.decode(_googleDirections.routes[0].overview_polyline.points);
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
                            "latitude":  yelpResult.businesses[i].coordinates.latitude,
                            "longitude":  yelpResult.businesses[i].coordinates.longitude,
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

    getGoogleDirections() {
        let origin = null;
        let tempInd = 0;
        if (false) {
            origin = this.state.latitude + ',' + this.state.longitude
        } else {
            origin = 'SanFrancisco,CA';
        }
        var destination = 'Sacramento,CA';
        var googleAPI = googleAPIURL + 'origin=' + origin + '&destination=' + destination + '&key=' + googleAPIKey;
        let listings = [];
        return new Promise(function (resolve, reject) {
            fetch(googleAPI)
            .then((response) => response.json())
            .done((result) => {
                resolve(result);
            });
        });
    }

    async search() {
        try {
            let googleDirections = await this.getGoogleDirections();
            let yelpListings = await this.getYelpListings(googleDirections);
            let listings = await this.getGoogleDistances(yelpListings);
            this.showResults(listings);

        } catch (err) {
            console.log(err)
        }

    }

    render () {
        return (
           <Container>
           <Header style= {{paddingTop: 30, backgroundColor: '#9b1706'}}>
              <Title style={{color: 'white'}}>Search</Title>
           </Header>

           <Content>

           <GooglePlacesAutocomplete
        placeholder='Start'
        minLength={2} // minimum length of text to search
        autoFocus={false}
        listViewDisplayed='auto'    // true/false/undefined
        fetchDetails={true}
        renderDescription={(row) => row.description || row.vicinity} // custom description render
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
          //types: '(cities)', // default: 'geocode'
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

        currentLocation={false} // Will add a 'Current location' button at the top of the predefined places list
        currentLocationLabel="Current Location"
        nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
        GoogleReverseGeocodingQuery={{
        }}
        GooglePlacesSearchQuery={{
          // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
          rankby: 'distance',
        }}
    //    predefinedPlaces={[this.state.currentLocation]}


        //filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities

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
     //types: '(cities)', // default: 'geocode'
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
   }}


   //filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities

   debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 200ms.
 />
           <Button block
           onPress = {() => this.search()}
           style={{backgroundColor: '#9b1706', marginRight: 10, marginLeft: 10}}>
               <Text style={{color: 'white', fontSize: 18}}> Find Stuff </Text>
           </Button>

           </Content>
       </Container>
        );
    }
}

module.exports = Search;
