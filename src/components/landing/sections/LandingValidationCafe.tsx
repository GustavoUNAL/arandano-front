import { LandingSection, LandingSectionHeader } from './shared'

export function LandingValidationCafe() {
  return (
    <LandingSection id="validacion" ariaLabelledBy="cafe-title" className="lp-cafe">
      <LandingSectionHeader
        align="left"
        titleId="cafe-title"
        title="Construido desde una necesidad real."
        subtitle="VOS-AI nació como un proyecto tecnológico para resolver las necesidades de operación y gestión de Arándano Café."
      />
      <p className="lp-cafe__body">
        El desarrollo comenzó con la gestión de ventas y actualmente evoluciona hacia
        inventario, recetas, clientes, analítica y automatización. El producto se valida
        con la operación diaria de un negocio real, no con escenarios de demostración.
      </p>
    </LandingSection>
  )
}
