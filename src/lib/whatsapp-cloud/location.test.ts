import { describe, expect, it } from 'vitest'
import { extractCoords, locationText } from './location'

describe('extractCoords', () => {
  it('prefiere el pin del lugar sobre el centro del mapa', () => {
    const url =
      'https://www.google.com/maps/place/Crisbo/@4.6097,-74.0817,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d4.6101!4d-74.0821'
    expect(extractCoords(url)).toEqual({ latitude: 4.6101, longitude: -74.0821 })
  })
  it('lee @lat,lng y ?q=lat,lng', () => {
    expect(extractCoords('https://www.google.com/maps/@6.2442,-75.5812,15z')).toEqual({ latitude: 6.2442, longitude: -75.5812 })
    expect(extractCoords('https://maps.google.com/?q=3.4516,-76.532')).toEqual({ latitude: 3.4516, longitude: -76.532 })
  })
  it('acepta coordenadas sueltas y URLs codificadas', () => {
    expect(extractCoords('4.65, -74.05')).toEqual({ latitude: 4.65, longitude: -74.05 })
    expect(extractCoords('https://consent.google.com/?continue=https%3A%2F%2Fwww.google.com%2Fmaps%2F%404.1%2C-74.2%2C15z')).toEqual({
      latitude: 4.1,
      longitude: -74.2,
    })
  })
  it('null si no hay coordenadas', () => {
    expect(extractCoords('https://maps.app.goo.gl/abc123')).toBeNull()
  })
})

describe('locationText', () => {
  it('arma nombre — dirección + link', () => {
    expect(locationText('Crisbo Tattoo', 'Calle 1 #2-3, Bogotá', 4.6, -74.08)).toBe(
      'Crisbo Tattoo — Calle 1 #2-3, Bogotá\nhttps://maps.google.com/?q=4.6,-74.08'
    )
  })
})
