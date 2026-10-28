import React, { useState } from "react";
import { Monitor, Shirt, Check, ShoppingBag } from "lucide-react";
import { categories, money, shoppingSummary } from "./models.mjs";
import {
  Tabs,
  Stats,
  Progress,
  Empty,
  useCollection,
  RowActions,
  AddButton,
  ExternalLink,useReadOnly,
} from "./components.jsx";
const fields = [
  {
    name: "title",
    label: "Nome do produto ou peça",
    required: true,
    maxLength: 140,
  },
  { name: "model", label: "Modelo / marca desejada" },
  { name: "price", label: "Preço estimado (R$)", placeholder: "Ex.: 1.299,90" },
  { name: "url", label: "Link do produto", type: "url" },
  { name: "purchased", label: "Já foi comprado", type: "checkbox" },
];
export default function Finance({ data, setData, notify, transactions }) {
  const readOnly=useReadOnly();
  const [tab, setTab] = useState("pc"),
    [category, setCategory] = useState("all");
  const pc = useCollection("pc", data, setData, notify, {
      fields,
      title: "peça do setup",
    }),
    style = useCollection("style", data, setData, notify, {
      fields: [
        fields[0],
        {
          name: "category",
          label: "Categoria",
          type: "select",
          options: categories,
          default: "camisa",
        },
        ...fields.slice(1),
      ],
      title: "produto",
      defaults: { category: "camisa" },
    });
  const items = tab === "pc" ? data.pc : data.style;
  const total = shoppingSummary([...data.pc, ...data.style]),
    s = shoppingSummary(items);
  const ed = tab === "pc" ? pc : style;
  return (
    <>
      <div className="finance-overview panel">
        <div>
          <span className="eyebrow">CONQUISTAS DO FINANCE</span>
          <h2>Planeje. Conquiste. Evolua.</h2>
          <p>Seu setup, seu estilo e os próximos itens da sua lista.</p>
        </div>
        <div
          className="achievement-ring"
          style={{ "--progress": total.percent + "%" }}
        >
          <span>
            {total.percent}
            <small>%</small>
          </span>
        </div>
        <Progress
          value={total.percent}
          label="RICK_PC + RICK_STYLE"
          detail={`${total.purchased} de ${total.total} itens comprados`}
        />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          ["pc", "RICK_PC"],
          ["style", "RICK_STYLE"],
          ["transactions", "Movimentações"],
        ]}
      />
      {tab === "transactions" ? (
        transactions
      ) : (
        <>
          <Stats
            items={[
              [tab === "pc" ? "PEÇAS NA LISTA" : "PRODUTOS NA LISTA", s.total],
              ["ORÇAMENTO DA LISTA", money(s.budgetCents)],
              ["VALOR JÁ INVESTIDO", money(s.spentCents)],
            ]}
          />
          <section className="panel">
            <div className="panel-head">
              <h3>
                {tab === "pc" ? <Monitor size={17} /> : <Shirt size={17} />}{" "}
                {tab === "pc" ? "SEU PRÓXIMO SETUP" : "SUAS ESCOLHAS"}
              </h3>
              <AddButton onClick={() => ed.open()}>
                {tab === "pc" ? "Adicionar peça" : "Adicionar produto"}
              </AddButton>
            </div>
            <div className="section-toolbar">
              <Progress
                value={s.percent}
                label="Progresso das conquistas"
                detail={`${s.purchased}/${s.total} comprados`}
              />
              {tab === "style" && (
                <label>
                  Filtrar categoria
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">Todas as categorias</option>
                    {Object.entries(categories).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {!items.length ? (
              <Empty
                icon={ShoppingBag}
                title={
                  tab === "pc"
                    ? "Cada peça aproxima o setup dos sonhos."
                    : "Seu estilo também merece um plano."
                }
                text="Adicione os produtos que você quer conquistar."
              />
            ) : (
              <div className="shopping-grid">
                {items
                  .filter(
                    (i) =>
                      tab === "pc" ||
                      category === "all" ||
                      i.category === category,
                  )
                  .map((i) => (
                    <article
                      className={
                        "shopping-card " + (i.purchased ? "purchased" : "")
                      }
                      key={i.id}
                    >
                      <div className="shopping-top">
                        <div className="product-icon">
                          {tab === "pc" ? (
                            <Monitor size={22} />
                          ) : (
                            <Shirt size={22} />
                          )}
                        </div>
                        <button
                          className={
                            "purchase-toggle " + (i.purchased ? "bought" : "")
                          }
                          aria-pressed={i.purchased} disabled={readOnly}
                          onClick={() =>
                            setData((d) => ({
                              ...d,
                              [tab]: d[tab].map((x) =>
                                x.id === i.id
                                  ? { ...x, purchased: !x.purchased }
                                  : x,
                              ),
                            }))
                          }
                        >
                          {i.purchased ? (
                            <Check size={13} />
                          ) : (
                            <ShoppingBag size={12} />
                          )}{" "}
                          {i.purchased ? "COMPRADO" : "COMPRAR"}
                        </button>
                      </div>
                      {i.category && (
                        <small className="product-category">
                          {categories[i.category]}
                        </small>
                      )}
                      <h3>{i.title}</h3>
                      <p>{i.model || "Modelo a escolher"}</p>
                      <strong className="product-price">
                        {money(i.priceCents)}
                      </strong>
                      <div className="shopping-bottom">
                        <ExternalLink url={i.url}>Ver produto</ExternalLink>
                        <RowActions editor={ed} record={i} />
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>
        </>
      )}
      {pc.ui}
      {style.ui}
    </>
  );
}
