import React, { Component } from 'react';
import Logo from './components/Logo/Logo';
import Navigation from './components/Navigation/Navigation';
import Rank from './components/Rank/Rank';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import SignIn from './components/SignIn/SignIn';
import Register from './components/Register/Register';
import Particles from 'react-particles-js';
import Clarifai from 'clarifai';
import './App.css';

const APP = new Clarifai.App({
  apiKey: 'YOUR API KEY'
});

const particlesOption = {
  particles: {
    number: {
      value: 120,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
};
class App extends Component {

  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signIn',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',        
        entries: 0,
        joined: ''
      }
    };
  };

  loadUser = data => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,        
        entries: data.entries,
        joined: data.joined
      }
    });
  };

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;

    const image = document.getElementById("inputImage");
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    };
  };

  displayFaceBox = (box) => {
    this.setState({box: box});    
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  };

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input})
    APP.models
      .predict(
        Clarifai.FACE_DETECT_MODEL, 
        this.state.input)
      .then(response => {
        if(response) {
          fetch('http://localhost:3000/image', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
          .then(response => response.json())
          .then(count => {
            this.setState(Object.assign(this.state.user, { entries: count }));
          });
        };

        this.displayFaceBox(this.calculateFaceLocation(response))
                  
        })
        .catch(error => console.log(error));                 
  };

  onRouteChange = (route) => {
    if(route === 'signOut') {
      this.setState({isSignedIn: false});
    } else if(route === 'home') {
      this.setState({isSignedIn: true});
    }

    this.setState({route: route});
  };

  render() {
    const {isSignedIn, imageUrl, route, box} = this.state;

    return (
      <div className="App">
        <Particles className="particles" params={particlesOption} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
        {route === 'home'
          ? <div>
              <Logo />        
              <Rank name={this.state.user.name} entries={this.state.user.entries} />
              <ImageLinkForm 
                onInputChange={this.onInputChange} 
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition box={box} imageUrl={imageUrl}/>
          </div>
          : (
            route === 'signIn' 
            ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          )          
        }
      </div>
    );
  };
};

export default App;
