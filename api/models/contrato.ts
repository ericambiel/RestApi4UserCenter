import { Departamento } from './departamento';
import { Documento } from './documento';

export class Contrato {
  // Dados exibido quando Mostar/Deletar
  id: number;
  objeto: string;           // Mudar para objeto
  estabFiscal: string;
  parceiro: string;
  cnpj: number;
  status: string;           // Mudar para status
  situacao: string;
  valTotal: number;         // Valor total
  dataInicio: string;
  dataFim: string;
  deptoPartList: [Departamento]; // Lista de Departamentos associados
  // Dados exibidos quando Inserir/Modificar
  indReajuste: string;
  diaAntecedencia: number;  // Dias de antecedencia
  obs: string;
  historico: string;
  anaJuridico: boolean;     // Analise juridica
  documento: [Documento];   // Mudar diretorio
}
