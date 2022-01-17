'use strict';
// prettier-ignore
const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let mapEvent;
class App {
    #map;
    #workouts = [];
    constructor(){
        this._getPosition();
        this._getLocalStorage();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationFields);
        containerWorkouts.addEventListener('click', this._panWorkout.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert(`Please share your location in order to use the app`);
        });
    }
    _loadMap(position) {
        const { latitude  } = position.coords;
        const { longitude  } = position.coords;
        // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);
        const coords = [
            latitude,
            longitude
        ];
        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#workouts.forEach((e)=>this._renderMapMarker(e)
        );
        /////////////Map Click show form////////////////////
        this.#map.on('click', function(mapE) {
            mapEvent = mapE;
            //   console.log(mapE);
            form.classList.remove('hidden');
            inputDistance.focus();
        });
    //
    }
    _toggleElevationFields() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {
        e.preventDefault();
        ///////////helper function
        const validInputs = (...inputs)=>inputs.every((inp)=>Number.isFinite(inp)
            )
        ;
        const allPositive = (...inputs)=>inputs.every((inp)=>inp > 0
            )
        ;
        /////variable///////
        let workout;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat , lng  } = mapEvent.latlng;
        const coords = [
            lat,
            lng
        ];
        //////////////taking input from form/////
        if (inputType.value === 'running') {
            const cadence = +inputCadence.value;
            if (// !Number.isFinite(distance) ||
            // !Number.isFinite(duration) ||
            // !Number.isFinite(cadence)
            !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert('Please enter a valid input');
            workout = new Running(distance, duration, coords, cadence);
        }
        if (inputType.value === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return alert('Please enter a valid input');
            else workout = new Cycling(distance, duration, coords, elevation);
        }
        ////pushing new workout to workoutsarray//////////
        this.#workouts.push(workout);
        // console.log(this.#workouts);
        this._renderMapMarker(workout);
        this._renderWorkouts(workout);
        this._setLocalStorage(workout);
    }
    _renderMapMarker(workout) {
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${inputType.value}-popup`
        })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`).openPopup();
        form.classList.add('hidden');
        form.reset();
    }
    _renderWorkouts(workout) {
        let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
  `;
        if (workout.type === 'running') html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;
        if (workout.type === 'cycling') html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
        form.insertAdjacentHTML('afterend', html);
    }
    _panWorkout(e) {
        if (!this.#map) return;
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;
        const workout = this.#workouts.find((work)=>work.id === workoutEl.dataset.id
        );
        this.#map.setView(workout.coords, 13, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    }
    _setLocalStorage(workout) {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;
        this.#workouts = data;
        console.log(data);
        this.#workouts.forEach((cur)=>this._renderWorkouts(cur)
        );
    }
    resetLocalStorage() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}
/////////////////////////////////////
const app = new App();
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(distance, duration, coords){
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;
    }
    _setDescription() {
        // prettier-ignore
        const months1 = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months1[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}
class Running extends Workout {
    type = 'running';
    constructor(distance, duration, coords, cadence){
        super(distance, duration, coords);
        this.cadence = cadence;
        this.getPace();
        this._setDescription();
    }
    getPace() {
        this.pace = this.distance / this.duration;
    }
}
class Cycling extends Workout {
    type = 'cycling';
    constructor(distance, duration, coords, elevationGain){
        super(distance, duration, coords);
        this.elevationGain = elevationGain;
        this.getSpeed();
        this._setDescription();
    }
    getSpeed() {
        this.Speed = this.distance / this.duration;
    }
}

//# sourceMappingURL=index.672d4772.js.map
