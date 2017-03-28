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

import keys from './../config';

var {GooglePlacesAutocomplete} = require('react-native-google-places-autocomplete');

var googleAPIURL = 'https://maps.googleapis.com/maps/api/directions/json?';

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
            });
            },
            (error) => null,
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    chooseRoute(_googleDirections) {
        this.props.navigator.push({
            name: 'ChooseRoute',
            passProps: {
                googleDirections: _googleDirections,
                latitude: this.state.latitude,
                longitude: this.state.longitude
            }
        })
    }

    getGoogleDirections() {
        let origin = this.state.origin;
        let destination = this.state.destination;
        var googleAPI = googleAPIURL + 'origin=' + origin + '&destination=' + destination + '&alternatives=true' + '&key=' + keys.googleKey;
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
            this.chooseRoute(googleDirections);
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
        renderDescription={(row) => row.description} // custom description render
        onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
          if (data.description == 'Current Location') {
              this.setState({
                  origin: data.geometry.location.lat + ',' + data.geometry.location.lng,
              });
          } else {
              this.setState({
                  origin: data.description,
              });
          }

        }}
        getDefaultValue={() => {
          return ''; // text input default value
        }}
        query={{
          // available options: https://developers.google.com/places/web-service/autocomplete
          key: keys.googleKey,
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

        currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
        currentLocationLabel="Current Location"
        nearbyPlacesAPI='None' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
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
       if (data.description == 'Current Location') {
           this.setState({
               destination: data.geometry.location.lat + ',' + data.geometry.location.lng,
           });
       } else {
           this.setState({
               destination: data.description,
           });
       }
   }}
   getDefaultValue={() => {
     return ''; // text input default value
   }}
   query={{
     // available options: https://developers.google.com/places/web-service/autocomplete
     key: keys.googleKey,
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
   currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
   currentLocationLabel="Current Location"
   nearbyPlacesAPI='None' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
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
