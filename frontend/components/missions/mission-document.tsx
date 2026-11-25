import { cn } from "@/lib/utils"
import { MISSION_TYPE_LABELS, TRANSPORTATION_LABELS, DEPARTMENT_NAME } from "@/lib/constants"
import { computeDuration, formatCurrency, formatDate, pluralDays } from "@/lib/utils/format"
import type { AppSettings, Employee, Mission } from "@/types"

interface MissionDocumentProps {
  mission: Mission
  employee?: Employee
  settings: AppSettings
  approverName?: string
  className?: string
}

export function MissionDocument({ mission, employee, settings, className }: MissionDocumentProps) {
  const duration = computeDuration(mission.departureDate, mission.departureTime, mission.returnDate, mission.returnTime)
  const { company, document: doc } = settings
  const isOfficial = mission.status === "VALIDE" && mission.approvedVersion === mission.version

  return (
    <article
      className={cn(
        "print-area relative mx-auto flex aspect-[210/297] w-full max-w-[210mm] flex-col bg-white text-[15px] leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200",
        className,
      )}
      style={{ padding: `${doc.marginMm}mm` }}
      aria-label={`Ordre de mission ${mission.reference}`}
    >
      {!isOfficial && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="-rotate-30 text-7xl font-bold tracking-widest text-slate-200/80 uppercase">
            Non validé
          </span>
        </div>
      )}

      <header
        className={cn(
          "relative flex items-center gap-4 border-b-2 border-slate-900 pb-3",
          doc.logoPosition === "CENTRE" && "flex-col text-center",
          doc.logoPosition === "DROITE" && "flex-row-reverse",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={company.logoDataUrl || "/assets/logo.png"}
          alt={`Logo ${company.name}`}
          className="h-20 w-auto shrink-0 object-contain"
        />
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-xl font-bold tracking-wide uppercase">{company.name}</span>
          {company.activity && (
            <span className="mt-0.5 text-sm font-bold text-slate-800">{company.activity}</span>
          )}
          {doc.headerText && <p className="mt-0.5 text-[11px] text-slate-600">{doc.headerText}</p>}
        </div>
      </header>

      <div className="relative flex items-end justify-between gap-4 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{DEPARTMENT_NAME}</span>
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold tracking-wide uppercase">Ordre de mission</h1>
            <span dir="rtl" className="text-2xl font-bold">تكليف بمهمة</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="font-mono text-base font-semibold">
            N° {mission.orderNumber?.trim() || "........"} / {mission.orderYear?.trim() || new Date(mission.createdAt).getFullYear()} <span dir="rtl">رقم</span>
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-4">
        <DocSection title="Agent missionné" titleAr="المكلف بالمهمة">
          <DocRow
            label="Nom et prénom"
            labelAr="الاسم واللقب"
            value={employee ? `${employee.lastName.toUpperCase()} ${employee.firstName}` : "—"}
          />
          <DocRow label="Fonction" labelAr="الوظيفة" value={mission.employeePosition || employee?.position} />
          <DocRow label="Résidence administrative" labelAr="الإقامة الإدارية" value={mission.serviceAssignment} />
        </DocSection>

        <DocSection title="Motif de déplacement" titleAr="سبب التنقل">
          <DocRow label="Type de mission" labelAr="نوع المهمة" value={MISSION_TYPE_LABELS[mission.missionType]} />
          <DocRow label="Motif" labelAr="الموضوع" value={mission.subject} full />
          {mission.description && <DocRow label="Description" labelAr="الوصف" value={mission.description} full />}
        </DocSection>

        <DocSection title="Itinéraire et durée" titleAr="المسار والمدة">
          <DocRow label="Lieu de départ" labelAr="مكان الانطلاق" value={mission.departureLocation} />
          <DocRow label="Se rendre à (Région)" labelAr="التوجه إلى (المنطقة)" value={mission.destination} />
          {mission.destinationAddress && <DocRow label="Adresse" labelAr="العنوان" value={mission.destinationAddress} full />}
          <DocRow
            label="Date de départ"
            labelAr="تاريخ الذهاب"
            value={
              mission.departureDate
                ? `${formatDate(mission.departureDate)}${mission.departureTime ? ` à ${mission.departureTime}` : ""}`
                : "—"
            }
          />
          <DocRow
            label="Date de retour"
            labelAr="تاريخ العودة"
            value={
              mission.returnDate
                ? `${formatDate(mission.returnDate)}${mission.returnTime ? ` à ${mission.returnTime}` : ""}`
                : "—"
            }
          />
        </DocSection>

        <DocSection title="Moyen de transport" titleAr="وسيلة النقل">
          <DocRow label="Transport" labelAr="النقل" value={TRANSPORTATION_LABELS[mission.transportation]} />
          {mission.vehicleName && <DocRow label="Type de véhicule" labelAr="نوع المركبة" value={mission.vehicleName} />}
          {mission.vehicleRegistration && (
            <DocRow label="Immatriculation" labelAr="رقم التسجيل" value={mission.vehicleRegistration} />
          )}
          {mission.estimatedExpenses !== undefined && (
            <DocRow label="Frais estimés" labelAr="المصاريف التقديرية" value={formatCurrency(mission.estimatedExpenses)} />
          )}
        </DocSection>

        {(mission.instructions || mission.observations) && (
          <DocSection title="Instructions et observations">
            {mission.instructions && <DocRow label="Instructions" value={mission.instructions} full />}
            {mission.observations && <DocRow label="Observations" value={mission.observations} full />}
          </DocSection>
        )}

        <div className="print-avoid-break mt-auto pt-4 pb-12">
          <p className="text-right text-sm">
            Fait à {mission.departureLocation || "—"}, le {formatDate(mission.createdAt)}
          </p>
        </div>
      </div>

      <footer className="relative mt-4 flex flex-col items-center gap-0.5 border-t border-slate-300 pt-2 text-center text-xs text-slate-600">
        {company.address && <span>{company.address}</span>}
        <span>
          {company.phone ? `Tél. ${company.phone}` : ""}
          {company.phone && company.email ? " · " : ""}
          {company.email ?? ""}
        </span>
      </footer>
    </article>
  )
}

function DocSection({ title, titleAr, children }: { title: string; titleAr?: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid-break flex flex-col gap-2.5">
      <h2 className="flex items-center justify-between border-b border-slate-300 pb-1 text-sm font-bold tracking-wider text-slate-700 uppercase">
        <span>{title}</span>
        {titleAr && <span dir="rtl">{titleAr}</span>}
      </h2>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  )
}

function DocRow({
  label,
  labelAr,
  value,
}: {
  label: string
  labelAr?: string
  value?: React.ReactNode
  full?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <dt className="w-44 shrink-0 text-slate-500">{label}</dt>
        <dd className="font-semibold">{value || "—"}</dd>
      </div>
      {labelAr && (
        <span dir="rtl" className="shrink-0 text-slate-500">
          {labelAr}
        </span>
      )}
    </div>
  )
}
