import {Suspense} from "react";
import {randomUUID} from "node:crypto";
import Link from "next/link";
import {workspace, operationOptions} from "@/lib/operations/data";
import {PageHeader} from "@/components/ui/page-header";
import {PageSkeleton} from "@/components/ui/skeleton";
import {TransactionForm} from "../../operacoes/transaction-form";

async function NewOrder() {
  const {access,client}=await workspace();
  if(access.role!=="gerente_logistico")return <section><PageHeader title="Novo pedido de produção" description="Criação de pedidos restrita ao perfil responsável."/><p>Somente o Gerente Logístico pode criar pedidos.</p><Link href="/painel/pedidos" className="btn-secondary mt-4">Consultar pedidos</Link></section>;
  const options=await operationOptions(client,access.companyId);
  return <section><PageHeader title="Novo pedido de produção" description="Escolha um modelo e informe a quantidade prevista." actions={<Link href="/painel/pedidos" className="btn-secondary">Voltar aos pedidos</Link>}/><div className="surface max-w-3xl p-5 sm:p-6"><TransactionForm task="order" requestKey={randomUUID()} options={options}/></div></section>;
}

export default function NewOrderPage() {
  return <Suspense fallback={<PageSkeleton label="Carregando novo pedido…" variant="form"/>}><NewOrder/></Suspense>;
}
