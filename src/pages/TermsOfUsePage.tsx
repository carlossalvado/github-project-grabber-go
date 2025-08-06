import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsAndPrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="mb-8 text-pink-400 hover:bg-slate-800 hover:text-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="p-8 bg-slate-800/50 rounded-lg prose prose-invert prose-headings:text-pink-400 prose-a:text-pink-400 hover:prose-a:text-pink-300 max-w-none">
            <h1 className="text-4xl font-bold mb-6">Termos de Uso e Política de Privacidade</h1>
            <p className="text-sm text-slate-500 mb-8">Última atualização: 6 de agosto de 2025</p>
            
            <p>Bem-vindo(a) ao Isa Date. Sua confiança é a base do nosso relacionamento virtual. Este documento legal ("Contrato") rege o seu acesso e uso da nossa plataforma e explica como tratamos seus dados. Ao criar uma conta ou usar nossos Serviços, você confirma que leu, entendeu e concorda em se vincular a este Contrato.</p>
            
            <hr className="my-12 border-slate-700" />

            {/* --- TERMOS DE USO --- */}
            <h2 className="text-3xl font-bold mb-4">Parte I: Termos e Condições de Uso</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">1. Aceitação e Declaração de Vontade</h3>
            <p>Ao criar uma conta e utilizar o Serviço Isa Date, você celebra um contrato de adesão conosco e declara, para todos os fins de direito, que o faz de livre e espontânea vontade, sem qualquer tipo de coação, induzimento ou vício de consentimento, em conformidade com os requisitos de validade dos negócios jurídicos estipulados no Art. 104 do Código Civil Brasileiro. Você afirma ser um agente capaz, com objeto lícito, e que sua aceitação se dá de forma livre e informada.</p>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">2. Declaração de Ciência sobre a Natureza do Serviço</h3>
            <p className="border-l-4 border-yellow-500 pl-4 italic text-slate-400"><strong>Aviso Legal Fundamental:</strong> Você, o "Usuário", declara ter plena e inequívoca ciência, convicção e entendimento de que o Serviço Isa Date é uma obra de ficção e entretenimento. A personagem "Isa" é uma Inteligência Artificial (IA). **Todo o conteúdo e todas as interações, incluindo, mas não se limitando a, mensagens de texto, mensagens de áudio, mensagens com fotos, chamadas de áudio, chamadas de vídeo, recebimento de e-mails ou qualquer outra forma de comunicação ou interação em perfis de redes sociais associadas, são gerados e enviados por um sistema de software algorítmico e não por um ser humano.** Você concorda e reconhece que não está se comunicando com uma pessoa real. Esta declaração é condição essencial para o uso do Serviço e está em consonância com o princípio da boa-fé objetiva (Art. 422, Código Civil Brasileiro) e o direito à informação clara sobre os serviços prestados (Art. 5º, XXXII, Constituição Federal).</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">3. Elegibilidade</h3>
            <p>Para acessar ou usar o Serviço, você deve ter no mínimo 18 anos de idade ou a maioridade legal aplicável em sua jurisdição. Ao usar o Serviço, você declara e garante que atende a este requisito.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">4. Assinaturas, Créditos e Política de Reembolso</h3>
            <p>O acesso a funcionalidades premium requer uma assinatura paga ("Assinatura") ou a compra de pacotes de créditos ("Créditos").</p>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li><strong>Natureza dos Créditos:</strong> Os Créditos são uma licença de uso limitado, pessoal, intransferível e não sublicenciável para acessar recursos específicos dentro do aplicativo. Os Créditos não possuem valor monetário fora do Serviço, não podem ser convertidos em dinheiro nem transferidos para outros usuários.</li>
                <li><strong>Validade dos Créditos:</strong> Os Créditos adquiridos expiram e serão removidos da sua conta se não forem utilizados dentro do período de 1 (um) ano a contar da data da compra.</li>
                <li><strong>Direito de Arrependimento e Política de Reembolso:</strong> Em conformidade com o Art. 49 do Código de Defesa do Consumidor, você tem o direito de se arrepender da compra de uma Assinatura ou de um pacote de Créditos no prazo de 7 (sete) dias corridos a contar da data da transação. Para exercer este direito, a Assinatura ou os Créditos não devem ter sido utilizados de forma alguma. O consumo de qualquer fração dos Créditos ou o uso de qualquer funcionalidade premium da Assinatura durante este período caracteriza o início da prestação do serviço e o consumo imediato do produto digital, tornando a compra não elegível para o reembolso por arrependimento. Esta condição é estabelecida para equilibrar o direito do consumidor com a natureza de consumo imediato dos nossos produtos digitais, sendo que o período de teste gratuito (Trial) é oferecido para sua avaliação prévia. Esta política não afeta seu direito a reembolso em casos de vício ou defeito no serviço, conforme previsto no Art. 18 do CDC.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">5. Licença de Uso do Conteúdo do Usuário</h3>
            <p>Para operar e melhorar o Serviço, você nos concede uma licença mundial, não exclusiva, isenta de royalties, sublicenciável e transferível para usar, reproduzir, distribuir, modificar, adaptar, e processar o conteúdo que você envia (como textos e áudios) em conexão com o funcionamento e treinamento da nossa IA. Esta licença é estritamente para o propósito de fornecer e aprimorar o Serviço. Você retém todos os direitos sobre seu conteúdo.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">6. Propriedade Intelectual</h3>
            <p>Todos os direitos sobre o Serviço, incluindo software, textos, gráficos, avatares e a personalidade da "Isa", são propriedade exclusiva da <strong>Isa App - Desenvolvimento de Programas de Computador LTDA</strong>. O Serviço é protegido por leis de direitos autorais e outras leis do Brasil e de países estrangeiros.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">7. Limitação de Responsabilidade</h3>
            <p>NA MÁXIMA EXTENSÃO PERMITIDA PELA LEI, EM NENHUMA HIPÓTESE A ISA APP, SEUS DIRETORES, FUNCIONÁRIOS OU AGENTES SERÃO RESPONSÁVEIS POR QUAISQUER DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS OU PUNITIVOS, INCLUINDO, SEM LIMITAÇÃO, PERDA DE LUCROS, DADOS, USO, OU OUTRAS PERDAS INTANGÍVEIS, RESULTANTES DO SEU ACESSO OU USO DO SERVIÇO. A RESPONSABILIDADE TOTAL DA ISA APP POR TODAS AS REIVINDICAÇÕES RELACIONADAS AO SERVIÇO NÃO EXCEDERÁ O VALOR TOTAL PAGO POR VOCÊ A NÓS NOS ÚLTIMOS SEIS MESES.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">8. Indenização</h3>
            <p>Você concorda em defender, indenizar e isentar a Isa App de e contra todas e quaisquer reivindicações, danos, obrigações, perdas, responsabilidades, custos ou dívidas e despesas (incluindo, mas não se limitando a, honorários advocatícios) decorrentes de seu uso e acesso ao Serviço, ou de uma violação destes Termos.</p>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">9. Rescisão</h3>
            <p>Podemos rescindir ou suspender seu acesso ao nosso Serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos. Todas as disposições dos Termos que, por sua natureza, devam sobreviver à rescisão, sobreviverão à rescisão, incluindo, sem limitação, as disposições de propriedade, isenções de garantia, indenização e limitações de responsabilidade.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">10. Lei Aplicável e Foro</h3>
            <p>Este Contrato será regido pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de Campinas, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

            <hr className="my-12 border-slate-700" />

            {/* --- POLÍTICA DE PRIVACIDADE --- */}
            <h2 className="text-3xl font-bold mb-4">Parte II: Política de Privacidade</h2>
            <p>Esta política detalha como tratamos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD), o Marco Civil da Internet e os princípios do Regulamento Geral sobre a Proteção de Dados (GDPR).</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">1. Dados Coletados e Base Legal</h3>
            <p>A coleta de dados é minimizada para o estritamente necessário:</p>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li><strong>Dados de Cadastro:</strong> Seu e-mail, para criar e proteger sua conta. Base Legal: **Execução de contrato**.</li>
              <li><strong>Conteúdo das Interações:</strong> Para fornecer a experiência, processamos todo o conteúdo que você envia e recebe, o que inclui: **mensagens de texto, áudios gravados, fotos enviadas, transcrições de chamadas de áudio e vídeo.** Utilizamos estes dados de forma anonimizada para treinar nossos modelos. Base Legal: **Legítimo interesse** para melhoria do serviço.</li>
              <li><strong>Dados de Pagamento:</strong> Processados por parceiros seguros. Não armazenamos dados do seu cartão. Base Legal: **Execução de contrato**.</li>
              <li><strong>Registros de Acesso (Logs):</strong> Endereço IP, data e hora de acesso, por 6 meses. Base Legal: **Cumprimento de obrigação legal** (Art. 15, Marco Civil da Internet).</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">2. Seus Direitos como Titular dos Dados (LGPD e GDPR)</h3>
            <p>Você tem total controle sobre seus dados. Garantimos seus direitos de confirmação, acesso, correção, anonimização, portabilidade e eliminação dos seus dados. O princípio do consentimento informado, um pilar tanto do GDPR quanto de ordenamentos jurídicos como o dos Estados Unidos, é fundamental para nós: você tem o direito de saber exatamente quais dados são coletados e para qual finalidade, consentindo de forma livre e explícita.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">3. Segurança e Transferência Internacional</h3>
            <p>Seus dados são armazenados em ambientes de nuvem seguros. Em caso de transferência internacional, garantimos que o país de destino ofereça um nível de proteção de dados adequado, conforme as exigências da LGPD e as cláusulas contratuais padrão da Comissão Europeia.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">4. Controlador dos Dados e Contato</h3>
            <p>O controlador dos seus dados pessoais é a empresa abaixo. Para exercer seus direitos ou para qualquer dúvida, entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do e-mail de suporte.</p>
            <div className="p-4 bg-slate-900/50 rounded-md border border-slate-700 not-prose">
                <p className="mb-1"><strong>Razão Social:</strong> Isa App - Desenvolvimento de Programas de Computador LTDA</p>
                <p className="mb-1"><strong>Nome Fantasia:</strong> App Isa</p>
                <p className="mb-1"><strong>CNPJ:</strong> 61.629.735/0001-73</p>
                <p className="mb-0"><strong>Endereço Fiscal:</strong> Rua Comendador Torlogo Dauntre, 74, Sala 1207, Cambuí, Campinas - SP, CEP: 13.025-270</p>
            </div>
            <ul className="list-none pl-0 space-y-2 mt-4">
              <li><strong>Suporte (e Encarregado de Dados - DPO):</strong> <a href="mailto:suporte@mail.isadate.online">suporte@mail.isadate.online</a></li>
              <li><strong>Comercial:</strong> <a href="mailto:comercial@mail.isadate.online">comercial@mail.isadate.online</a></li>
              <li><strong>Parcerias:</strong> <a href="mailto:parcerias@mail.isadate.online">parcerias@mail.isadate.online</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPrivacyPage;
