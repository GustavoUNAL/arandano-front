/**
 * Representación de la interfaz real: barra lateral + ventas del día.
 * No usa fotos de stock ni métricas de marketing inventadas.
 */
export function LandingProductPreview() {
  return (
    <figure className="lp-preview" aria-label="Vista de ventas en VOS-AI">
      <div className="lp-preview__window">
        <div className="lp-preview__chrome" aria-hidden>
          <span />
          <span />
          <span />
          <p>VOS-AI · Ventas</p>
        </div>
        <div className="lp-preview__body">
          <aside className="lp-preview__rail" aria-hidden>
            <strong>VOS-AI</strong>
            {['Ventas', 'Inventario', 'Recetas', 'Citas', 'Clientes'].map((item, i) => (
              <span key={item} className={i === 0 ? 'is-on' : undefined}>
                {item}
              </span>
            ))}
          </aside>
          <div className="lp-preview__main">
            <header>
              <p>Hoy</p>
              <h3>Registro de ventas</h3>
            </header>
            <ul>
              <li>
                <span>Mesa 4</span>
                <span>Café americano</span>
                <em>Caja</em>
              </li>
              <li>
                <span>Para llevar</span>
                <span>2 Mojitos</span>
                <em>POS</em>
              </li>
              <li>
                <span>Mesa 1</span>
                <span>Bowl + limonada</span>
                <em>Caja</em>
              </li>
              <li>
                <span>Web</span>
                <span>Pedido tienda</span>
                <em>Canal</em>
              </li>
            </ul>
            <footer>
              <span>Mismos datos en inventario, recetas y cierre de caja</span>
            </footer>
          </div>
        </div>
      </div>
      <figcaption className="lp-preview__cap">
        Interfaz de ventas. Cada movimiento queda en la misma base de datos.
      </figcaption>
    </figure>
  )
}
