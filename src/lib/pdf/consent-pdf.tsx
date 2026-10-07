import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import {
  PERSONAL_FIELDS,
  HEALTH,
  ACCEPT,
  DESIGN_FIELDS,
  formStr,
  siNo,
  boolSiNo,
  healthDetailKey,
} from '@/lib/consents/consent-fields'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  studioName: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  meta: { fontSize: 9, color: '#555', marginBottom: 14 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, borderBottom: '1px solid #ddd', paddingBottom: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { color: '#555', flex: 1, paddingRight: 8 },
  value: { flex: 1, textAlign: 'right' },
  legal: { fontSize: 8, color: '#333', lineHeight: 1.4 },
  declLine: { marginBottom: 2 },
  sigBox: { marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 10 },
  sigImg: { width: 200, height: 80, objectFit: 'contain' },
  footer: { marginTop: 18, fontSize: 8, color: '#777' },
})

export function ConsentPdf({
  studioName,
  clientName,
  projectName,
  templateName,
  templateContent,
  formData,
  signatureData,
  signedAt,
  signerIp,
}: {
  studioName: string
  clientName: string
  projectName: string
  templateName: string | null
  templateContent: string | null
  formData: Record<string, unknown> | null
  signatureData: string | null
  signedAt: string | null
  signerIp: string | null
}) {
  const signedText = signedAt
    ? new Date(signedAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
    : '—'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.studioName}>{studioName}</Text>
        <Text style={styles.title}>Consentimiento informado</Text>
        <Text style={styles.meta}>
          {projectName ? `Proyecto: ${projectName} · ` : ''}Cliente: {clientName}
        </Text>

        {templateContent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{templateName ?? 'Términos'}</Text>
            <Text style={styles.legal}>{templateContent}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          {PERSONAL_FIELDS.map(([key, label]) => {
            const v = formStr(formData, key)
            if (!v) return null
            return (
              <View style={styles.row} key={key}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{v}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de salud</Text>
          {HEALTH.map(([key, label]) => {
            const detail = formStr(formData, healthDetailKey(key))
            return (
              <View key={key} style={{ marginBottom: 3 }}>
                <View style={styles.row}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>{siNo(formData?.[key])}</Text>
                </View>
                {formData?.[key] === 'si' && detail !== '' && (
                  <Text style={{ fontSize: 8, color: '#555' }}>— {detail}</Text>
                )}
              </View>
            )
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proyecto y diseño</Text>
          {DESIGN_FIELDS.map(([key, label]) => {
            const v = formStr(formData, key)
            if (!v) return null
            return (
              <View style={styles.row} key={key}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{v}</Text>
              </View>
            )
          })}
          <Text style={[styles.declLine, { marginTop: 4 }]}>
            [{boolSiNo(formData?.['confirma_diseno']) === 'Sí' ? 'X' : ' '}] Confirmo que este es el diseño
            que voy a tatuarme.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Declaraciones</Text>
          {ACCEPT.map(([key, label]) => (
            <Text style={styles.declLine} key={key}>
              [{boolSiNo(formData?.[key]) === 'Sí' ? 'X' : ' '}] {label}
            </Text>
          ))}
          <Text style={[styles.declLine, { marginTop: 4 }]}>
            Autoriza uso de fotos/videos con fines promocionales: {siNo(formData?.['autoriza_fotos'])}
          </Text>
        </View>

        <View style={styles.sigBox}>
          <Text style={styles.sectionTitle}>Firma del cliente</Text>
          {signatureData ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image style={styles.sigImg} src={signatureData} />
          ) : (
            <Text style={styles.label}>Sin firma registrada.</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Firmado el {signedText}.</Text>
          {signerIp && <Text>IP del firmante: {signerIp}</Text>}
        </View>
      </Page>
    </Document>
  )
}
