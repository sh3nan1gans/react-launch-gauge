import React from 'react'
import PropTypes from 'prop-types'
import GaugePath from './GaugePath'
import { pie } from 'd3-shape'
import { easeLinear } from 'd3-ease'
import { timer } from 'd3-timer'
import { interpolate } from 'd3-interpolate'

export default class Gauge extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    max: PropTypes.number,
    high: PropTypes.number,
    value: PropTypes.any,
    decimal: PropTypes.number,
    startAngle: PropTypes.number,
    endAngle: PropTypes.number,
    unit: PropTypes.string,
    title: PropTypes.string,
    titleStyle: PropTypes.object,
    titleClass: PropTypes.string,
    textStyle: PropTypes.object,
    mainBkg: PropTypes.string,
    progressBkg: PropTypes.string,
    progressColor: PropTypes.string,
    highColor: PropTypes.string,
    progressStyle: PropTypes.object,
    wrapStyle: PropTypes.object,
    style: PropTypes.object,
    duration: PropTypes.number,
    id: PropTypes.string.isRequired
  };

  static defaultProps = {
    width: 200,
    height: 170,
    max: 100,
    high: 90,
    startAngle: 180,
    endAngle: 420,
    decimal: 2,
    duration: 500,
    progressColor: '#FFFFFF',
    progressBkg: '#666',
    mainBkg: '#333',
    highColor: 'crimson',
    id: 'launch-gauge'
  };
  constructor (props) {
    super(props)
    this.componentWillMount = this.componentWillMount.bind(this)
    this._updateStateValue = this._updateStateValue.bind(this)
    this.goTween = this.goTween.bind(this)
    this.tweenUp = this.tweenUp.bind(this)
    this.tweenDown = this.tweenDown.bind(this)
    this.state = {
      val: props.value
    }
  }
  componentDidMount () {
  }
  componentWillUnmount () {
  }
  componentWillUpdate (nextProps, nextState) {
    if (nextProps.value !== this.props.value) {
      var parsedVal = parseFloat(this.props.value)
      var parsedNext = parseFloat(nextProps.value)
      // console.log("Will Change Value!");
      // If we're growing, tween in the positive direction
      var func
      if (parsedNext > parsedVal) {
        func = this.tweenUp
      } else {
        func = this.tweenDown
      }
      this.tween = func('val', this.state.val, parsedNext, this.props.duration).then((timer) => {
        // console.log("Tween End!");
        timer.stop()
      })
    }
  }
  componentWillMount () {
    this.pie = pie()
    .value(function (d) { return d.number })
      .startAngle(this.props.startAngle / 180 * Math.PI)
      .endAngle(this.props.endAngle / 180 * Math.PI)
      .sort(null)
  }
  _updateStateValue (prop, v) {
    if (typeof v !== 'number') {
      return false
    }
    if (this.state && this.state[prop] !== undefined) {
      let state = {}
      state[prop] = v
      this.setState(state)
    } else {
      let { ...state } = this.state
      state[prop] = v
      this.setState(state)
    }
  }
  tweenUp (prop, start, end, duration = 500, easing = 'Linear') {
    return this.goTween(prop, start, end, duration, 1, easing)
  }
  tweenDown (prop, start, end, duration = 500, easing = 'Linear') {
    return this.goTween(prop, start, end, duration, -1, easing)
  }
  goTween (prop, start, end, duration = 500, direction = 1, easing = 'Linear') {
    // console.log("Tween with Duration ", duration)
    return new Promise((resolve, reject) => {
      let i = interpolate(start, end)
      let easeFun = easeLinear

      /* The timer stops when the callback retuns a truthy value */
      var time = timer((elapsed, d) => {
        if (this._setStopped) { return true }
        // return true;

        let progress = easeFun(elapsed / duration)

        let value = i(progress)

        // num = value;
        if (direction > 0) {
          if (value >= end) {
            // console.log("Hit the Step Point!")
            this._updateStateValue(prop, end)
            resolve(time)
            return true
          }
        } else {
          if (value <= end) {
            // console.log("Hit the Step Point!")
            this._updateStateValue(prop, end)
            resolve(time)
            return true
          }
        }

        this._updateStateValue(prop, value)

        // _self.setState({width: value})
        if (elapsed > duration) {
          this._updateStateValue(prop, end)
          resolve(time)
          return true
        }
      })
    })
  }
  render () {
    let {
      height,
      width,
      wrapStyle,
      style,
      mainBkg,
      title,
      titleStyle,
      titleClass,
      textStyle,
      progressStyle,
      progressBkg,
      progressColor,
      highColor,
      decimal,
      max,
      high
    } = this.props
    let {
      val
    } = this.state
    let valueData = [
      { number: 0, color: 'none' },
      { number: val, color: progressColor },
      { number: max - val, color: 'rgba(0,0,0,0)' }
    ]
    let baseData = [
      { number: 0, color: 'none' },
      { number: high, color: progressBkg },
      { number: max - high, color: highColor }
    ]
    return (
      <div style={{ width: width, ...wrapStyle }} ref={'wrap'}>
        <div
          className={titleClass}
          style={
           Object.assign(
             {},
             (!titleClass && { background: '#666', padding: '4px 12px', color: 'white', fontSize: 24 }),
             titleStyle)}>
          {title}
        </div>
        <svg
          id={this.props.id}
          width={this.props.width}
          height={this.props.height}
          style={{ background: mainBkg, ...style }}>
          <GaugePath
            width={this.props.width}
            height={this.props.height}
            pie={this.pie}
            color={this.color}
            data={baseData} />
          <GaugePath
            width={this.props.width}
            height={this.props.height}
            pie={this.pie}
            style={progressStyle}
            data={valueData} />
          <text
            x={this.props.width / 2}
            y={this.props.height / 2}
            fontSize={42}
            fill={'#eee'}
            textAnchor={'middle'}
            alignmentBaseline={'central'}
            style={textStyle}>
            {
              val &&
              val.toLocaleString(undefined,
                {
                  minimumFractionDigits: decimal,
                  maximumFractionDigits: decimal
                })
            }
          </text>
          <text
            x={this.props.width * 0.60}
            y={this.props.height - 40}
            fontSize={24}
            fill={'#eee'}
            textAnchor={'right'}
            alignmentBaseline={'central'}
            style={textStyle}>
            {this.props.unit}
          </text>
          <rect
            x={1}
            y={1}
            width={width - 2}
            height={height - 2}
            fill={'transparent'}
            stroke={'rgb(170, 170, 170)'}
            strokeWidth={'2px'} />
          <polygon
            points={`${width * 0.75},${height} \
            ${width * 0.8},${height * 0.95}  ${width},${height * 0.95} \
            ${width},${height} ${width * 0.75},${height}`}
            style={{ fill: ('#aaa'), stroke:'', strokeWidth:1 }} />
        </svg>
      </div>
    )
  }
}
