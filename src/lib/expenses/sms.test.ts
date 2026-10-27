import { describe, expect, it } from 'vitest'
import { parseAmount, parseBankSms } from './sms'

describe('parseAmount', () => {
  it('reads each bank format', () => {
    expect(parseAmount('82.013,95')).toBe(82014)
    expect(parseAmount('$7,000')).toBe(7000)
    expect(parseAmount('$375,000')).toBe(375000)
    expect(parseAmount('$375.000,00')).toBe(375000)
    expect(parseAmount('$373.809,96')).toBe(373810)
    expect(parseAmount('0,00')).toBe(0)
  })
})

describe('parseBankSms', () => {
  it('Nequi payment is an expense with the merchant', () => {
    expect(parseBankSms('NEQUI: Pagaste 82.013,95 en GOOGLE*PLAY')).toEqual({
      income: false, amount: 82014, medio: 'Nequi', comercio: 'GOOGLE*PLAY', pagador: null,
    })
  })

  it('Daviplata QR purchase and money received', () => {
    expect(parseBankSms('DaviPlata: tu compra de $7,000 por codigo QR fue exitosa. Para saber mas, consulta tus movimientos desde la app DaviPlata.'))
      .toMatchObject({ income: false, amount: 7000, medio: 'Daviplata' })
    expect(parseBankSms('Recibiste $375,000. Para saber mas, consulta tus movimientos.'))
      .toEqual({ income: true, amount: 375000, medio: 'Daviplata', comercio: null, pagador: null })
  })

  it('Bold transfer in and out', () => {
    expect(parseBankSms('Bold CF: Has recibido una transferencia por un valor de $373.809,96 en tu cuenta Bold terminada en *3618. 24/10/2026 06:07 PM'))
      .toEqual({ income: true, amount: 373810, medio: 'Bold', comercio: null, pagador: null })
    expect(parseBankSms('BoldCF: Realizaste una transferencia a traves de llaves por un valor de $375.000,00 desde tu cuenta terminada en *3618. 24/10/2026 06:16PM'))
      .toMatchObject({ income: false, amount: 375000, medio: 'Bold' })
  })

  it('Nequi Negocios money received, with who paid', () => {
    expect(parseBankSms('Nequi: Tu negocio CRISBO TATTOO recibio $1.000 de CRISTIAN RICARDO BOJACA MORENO  el 26/10/2026 a las 03:19 a.m. a través de Bre-B - Vende mas con Nequi Negocios.'))
      .toEqual({ income: true, amount: 1000, medio: 'Nequi', comercio: null, pagador: 'CRISTIAN RICARDO BOJACA MORENO' })
  })

  it('Apple Pay purchase with the Nu card (text built by the Wallet automation)', () => {
    expect(parseBankSms('Nu: Pagaste $45.900,00 en EXITO CHAPINERO')).toEqual({
      income: false, amount: 45900, medio: 'Nu', comercio: 'EXITO CHAPINERO', pagador: null,
    })
    expect(parseBankSms('Nu: Pagaste COP 12,000.00 en D1 SUBA')?.amount).toBe(12000)
  })

  it('ignores failed payments, holds, logins and junk', () => {
    expect(parseBankSms('NEQUI: No te alcanzo para pagar 65.611,15 en ANTHROPIC* CLAUDE SUB')).toBeNull()
    expect(parseBankSms('NEQUI: Pagaste 0,00 en GOOGLE *TEMPORARY HOLD')).toBeNull()
    expect(parseBankSms('Bold CF: Has ingresado exitosamente a tu cuenta Bold. 24/10/2026 06:15 PM.')).toBeNull()
    expect(parseBankSms('Tu codigo de verificacion es 123456')).toBeNull()
  })
})
