import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDollarSign,
  ExternalLink,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";

type Props = { params: Promise<{ locale: string }> };

type Provider = {
  name: string;
  logo: string;
  tone: string;
  tagline: string;
  models: { name: string; price: string }[];
  steps: string[];
  pricing: string;
  recommendation: string;
  links: { label: string; href: string }[];
};

const providersEs: Provider[] = [
  {
    name: "Google Gemini",
    logo: "gemini-color",
    tone: "from-blue-400/20 to-cyan-300/10 text-cyan-200",
    tagline: "La forma más sencilla de empezar sin pagar",
    models: [
      { name: "Gemini 3.5 Flash-Lite", price: "USD 0.30 / 2.50 por 1 M" },
      { name: "Gemini 3.5 Flash", price: "USD 1.50 / 9.00 por 1 M" },
      { name: "Gemini 3.1 Pro Preview", price: "USD 2.00 / 12.00 por 1 M" },
    ],
    steps: [
      "Abre Google AI Studio e inicia sesión.",
      "Entra en API Keys y selecciona Create API key.",
      "Copia la clave, vuelve a AALIE y selecciona Gemini.",
    ],
    pricing:
      "Google ofrece un nivel gratuito para determinados modelos. El nivel de pago requiere Cloud Billing y puede solicitar una precarga mínima de USD 10.",
    recommendation:
      "Recomendado para empezar rápidamente y probar el asistente con una buena relación entre coste y capacidad.",
    links: [
      { label: "Crear una clave", href: "https://aistudio.google.com/api-keys" },
      {
        label: "Precios oficiales",
        href: "https://ai.google.dev/gemini-api/docs/pricing?hl=es-419",
      },
    ],
  },
  {
    name: "OpenAI",
    logo: "openai",
    tone: "from-emerald-400/20 to-teal-300/10 text-emerald-200",
    tagline: "Acceso directo a la familia GPT",
    models: [
      { name: "GPT-5.6 Luna", price: "USD 0.20 / 1.20 por 1 M" },
      { name: "GPT-5.6 Terra", price: "USD 2.00 / 12.00 por 1 M" },
      { name: "GPT-5.6 Sol", price: "USD 5.00 / 30.00 por 1 M" },
    ],
    steps: [
      "Entra en OpenAI Platform y abre API keys.",
      "Crea una nueva clave secreta y cópiala inmediatamente.",
      "Configura saldo si es necesario y selecciona OpenAI en AALIE.",
    ],
    pricing:
      "La API utiliza facturación independiente de ChatGPT. Las cuentas nuevas usan facturación prepagada y la compra mínima indicada es de USD 5.",
    recommendation:
      "Recomendado si quieres acceso directo a modelos GPT y priorizas calidad sobre el coste mínimo.",
    links: [
      { label: "Crear una clave", href: "https://platform.openai.com/api-keys" },
      {
        label: "Precios oficiales",
        href: "https://developers.openai.com/api/docs/pricing",
      },
    ],
  },
  {
    name: "Anthropic",
    logo: "anthropic",
    tone: "from-orange-300/20 to-amber-200/10 text-orange-200",
    tagline: "Claude mediante la API oficial",
    models: [
      { name: "Claude Haiku 4.5", price: "USD 1.00 / 5.00 por 1 M" },
      { name: "Claude Sonnet 5", price: "USD 2.00 / 10.00 por 1 M" },
      { name: "Claude Opus 5", price: "USD 5.00 / 25.00 por 1 M" },
    ],
    steps: [
      "Crea una cuenta o inicia sesión en Claude Platform.",
      "Abre Settings → API Keys y crea una clave con nombre AALIE.",
      "Cópiala de forma segura, configura la facturación y selecciónala en AALIE.",
    ],
    pricing:
      "Anthropic cobra por millón de tokens. También ofrece prompt caching y descuentos para Batch API en modelos compatibles.",
    recommendation:
      "Recomendado para explicaciones extensas, razonamiento y programación.",
    links: [
      { label: "Administrar claves", href: "https://platform.claude.com/settings/keys" },
      {
        label: "Precios oficiales",
        href: "https://platform.claude.com/docs/en/about-claude/pricing",
      },
    ],
  },
  {
    name: "DeepSeek",
    logo: "deepseek-color",
    tone: "from-sky-400/20 to-blue-300/10 text-sky-200",
    tagline: "Una API comercial de coste especialmente bajo",
    models: [
      { name: "DeepSeek V4 Flash", price: "USD 0.22 / 0.66 por 1 M" },
      { name: "DeepSeek V4 Pro", price: "USD 0.66 / 1.98 por 1 M" },
    ],
    steps: [
      "Abre DeepSeek Platform y entra en API Keys.",
      "Crea una nueva clave y cópiala.",
      "Añade saldo si es necesario y selecciona DeepSeek en AALIE.",
    ],
    pricing:
      "El precio distingue entre entradas en caché y entradas nuevas, y también cambia entre horario pico y valle.",
    recommendation:
      "Recomendado para experimentar con modelos potentes manteniendo bajo el coste por token.",
    links: [
      { label: "Crear una clave", href: "https://platform.deepseek.com/api_keys" },
      {
        label: "Precios oficiales",
        href: "https://api-docs.deepseek.com/quick_start/pricing/",
      },
    ],
  },
  {
    name: "OpenRouter",
    logo: "openrouter",
    tone: "from-violet-400/20 to-fuchsia-300/10 text-violet-200",
    tagline: "Muchos proveedores con una sola clave",
    models: [
      { name: "Catálogo OpenAI", price: "Precio del modelo" },
      { name: "Catálogo Anthropic", price: "Precio del modelo" },
      { name: "Modelos :free", price: "Sin coste, con límites" },
    ],
    steps: [
      "Crea una cuenta y abre la sección de claves.",
      "Selecciona Create API Key, ponle un nombre y establece un límite si quieres.",
      "Copia la clave, selecciona OpenRouter en AALIE y elige el modelo.",
    ],
    pricing:
      "Cada modelo conserva su precio de entrada y salida. OpenRouter cobra actualmente una comisión al comprar créditos y ofrece modelos gratuitos con límites diarios.",
    recommendation:
      "Recomendado para comparar modelos y cambiar de proveedor sin crear una cuenta distinta en cada laboratorio.",
    links: [
      { label: "Crear una clave", href: "https://openrouter.ai/settings/keys" },
      { label: "Catálogo y precios", href: "https://openrouter.ai/models" },
    ],
  },
  {
    name: "Ollama local / Cloud",
    logo: "ollama",
    tone: "from-lime-300/20 to-green-300/10 text-lime-200",
    tagline: "Modelos locales sin pagar por token",
    models: [
      { name: "Modelos locales", price: "Sin cobro por token" },
      { name: "Ollama Cloud Free", price: "USD 0 / con límites" },
      { name: "Ollama Cloud Pro", price: "USD 20 / mes" },
    ],
    steps: [
      "Instala Ollama y descarga el modelo que quieras.",
      "Ejecuta Ollama y selecciona Ollama local en AALIE.",
      "Para Ollama Cloud, crea una clave en la configuración y selecciona ese modo.",
    ],
    pricing:
      "Ollama local no necesita clave ni cobra por token: utiliza la CPU, GPU, memoria y electricidad de tu equipo. Cloud funciona con planes de uso.",
    recommendation:
      "Recomendado para privacidad, experimentación local y usuarios con hardware capaz de ejecutar el modelo.",
    links: [
      { label: "Descargar Ollama", href: "https://ollama.com/download" },
      { label: "Autenticación oficial", href: "https://docs.ollama.com/api/authentication" },
    ],
  },
  {
    name: "Mistral AI",
    logo: "mistral-color",
    tone: "from-pink-400/20 to-rose-300/10 text-pink-200",
    tagline: "Modelos abiertos con un nivel inicial gratuito",
    models: [
      { name: "Mistral Small 4", price: "USD 0.15 / 0.60 por 1 M" },
      { name: "Mistral Large 3", price: "USD 0.50 / 1.50 por 1 M" },
      { name: "Mistral Medium 3.5", price: "USD 1.50 / 7.50 por 1 M" },
    ],
    steps: [
      "Crea una cuenta y abre Mistral Studio.",
      "Entra en API Keys, selecciona Create new key y define una expiración.",
      "Copia la clave inmediatamente e introdúcela en AALIE.",
    ],
    pricing:
      "El Free mode permite un volumen limitado sin tarjeta. Mistral ofrece además un descuento del 50 % para procesamiento Batch.",
    recommendation:
      "Recomendado para usuarios que buscan modelos abiertos o europeos y una API con entrada gratuita.",
    links: [
      {
        label: "Crear una clave",
        href: "https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key",
      },
      { label: "Precios oficiales", href: "https://mistral.ai/pricing/api/" },
    ],
  },
  {
    name: "xAI",
    logo: "xai",
    tone: "from-slate-200/20 to-slate-400/10 text-slate-100",
    tagline: "Modelos Grok mediante una API independiente",
    models: [{ name: "Grok 4.6", price: "USD 2.00 / 6.00 por 1 M" }],
    steps: [
      "Crea una cuenta y abre xAI Console.",
      "Añade créditos, entra en API Keys y selecciona Create API Key.",
      "Copia la clave y selecciona xAI dentro de AALIE.",
    ],
    pricing:
      "Para contextos de hasta 200 mil tokens, Grok 4.6 tiene el precio indicado. Los contextos más largos tienen una tarifa superior.",
    recommendation:
      "Recomendado si te interesan específicamente Grok o las herramientas del ecosistema xAI.",
    links: [
      { label: "Guía de inicio", href: "https://docs.x.ai/developers/quickstart" },
      { label: "Precios oficiales", href: "https://docs.x.ai/developers/pricing" },
    ],
  },
  {
    name: "Groq",
    logo: "groq",
    tone: "from-yellow-300/20 to-orange-300/10 text-yellow-200",
    tagline: "Inferencia de modelos abiertos con muy baja latencia",
    models: [
      { name: "Modelos disponibles", price: "Según el modelo" },
      { name: "GroqCloud Free", price: "Sin coste, con límites" },
    ],
    steps: [
      "Crea una cuenta en GroqCloud y abre la consola.",
      "Entra en API Keys y crea una clave para tu proyecto.",
      "Copia la clave y selecciona Groq en AALIE.",
    ],
    pricing:
      "Groq mantiene un nivel gratuito con límites. El nivel Developer cobra según el consumo del modelo seleccionado.",
    recommendation:
      "Recomendado si priorizas velocidad de inferencia o quieres modelos abiertos mediante una API alojada.",
    links: [
      { label: "Inicio rápido", href: "https://console.groq.com/docs/quickstart" },
      { label: "Facturación", href: "https://console.groq.com/docs/billing-faqs" },
    ],
  },
];

const providersEn: Provider[] = [
  {
    name: "Google Gemini",
    logo: "gemini-color",
    tone: "from-blue-400/20 to-cyan-300/10 text-cyan-200",
    tagline: "The easiest way to start without paying",
    models: [
      { name: "Gemini 3.5 Flash-Lite", price: "USD 0.30 / 2.50 per 1 M" },
      { name: "Gemini 3.5 Flash", price: "USD 1.50 / 9.00 per 1 M" },
      { name: "Gemini 3.1 Pro Preview", price: "USD 2.00 / 12.00 per 1 M" },
    ],
    steps: [
      "Open Google AI Studio and sign in.",
      "Go to API Keys and select Create API key.",
      "Copy the key, return to AALIE, and select Gemini.",
    ],
    pricing: "Google offers a free tier for selected models. Paid use requires Cloud Billing and may ask for a USD 10 minimum prepayment.",
    recommendation: "Recommended for getting started quickly with a good balance of cost and capability.",
    links: [
      { label: "Create a key", href: "https://aistudio.google.com/api-keys" },
      { label: "Official pricing", href: "https://ai.google.dev/gemini-api/docs/pricing" },
    ],
  },
  {
    name: "OpenAI",
    logo: "openai",
    tone: "from-emerald-400/20 to-teal-300/10 text-emerald-200",
    tagline: "Direct access to the GPT family",
    models: [
      { name: "GPT-5.6 Luna", price: "USD 0.20 / 1.20 per 1 M" },
      { name: "GPT-5.6 Terra", price: "USD 2.00 / 12.00 per 1 M" },
      { name: "GPT-5.6 Sol", price: "USD 5.00 / 30.00 per 1 M" },
    ],
    steps: [
      "Open OpenAI Platform and go to API keys.",
      "Create a secret key and copy it immediately.",
      "Add balance if needed and select OpenAI in AALIE.",
    ],
    pricing: "The API is billed separately from ChatGPT. New API accounts use prepaid billing; the stated minimum purchase is USD 5.",
    recommendation: "Recommended when direct GPT access matters more than the lowest possible cost.",
    links: [
      { label: "Create a key", href: "https://platform.openai.com/api-keys" },
      { label: "Official pricing", href: "https://developers.openai.com/api/docs/pricing" },
    ],
  },
  {
    name: "Anthropic",
    logo: "anthropic",
    tone: "from-orange-300/20 to-amber-200/10 text-orange-200",
    tagline: "Claude through the official API",
    models: [
      { name: "Claude Haiku 4.5", price: "USD 1.00 / 5.00 per 1 M" },
      { name: "Claude Sonnet 5", price: "USD 2.00 / 10.00 per 1 M" },
      { name: "Claude Opus 5", price: "USD 5.00 / 25.00 per 1 M" },
    ],
    steps: [
      "Create an account or sign in to Claude Platform.",
      "Open Settings → API Keys and create a key named AALIE.",
      "Store it safely, configure billing, and select Anthropic in AALIE.",
    ],
    pricing: "Anthropic charges per million tokens and also offers prompt caching and Batch API discounts on compatible models.",
    recommendation: "Recommended for long explanations, reasoning, and programming tasks.",
    links: [
      { label: "Manage keys", href: "https://platform.claude.com/settings/keys" },
      { label: "Official pricing", href: "https://platform.claude.com/docs/en/about-claude/pricing" },
    ],
  },
  {
    name: "DeepSeek",
    logo: "deepseek-color",
    tone: "from-sky-400/20 to-blue-300/10 text-sky-200",
    tagline: "A particularly low-cost commercial API",
    models: [
      { name: "DeepSeek V4 Flash", price: "USD 0.22 / 0.66 per 1 M" },
      { name: "DeepSeek V4 Pro", price: "USD 0.66 / 1.98 per 1 M" },
    ],
    steps: [
      "Open DeepSeek Platform and go to API Keys.",
      "Create a new key and copy it.",
      "Add balance if needed and select DeepSeek in AALIE.",
    ],
    pricing: "Pricing distinguishes cached from new input and peak from off-peak hours.",
    recommendation: "Recommended for trying capable models while keeping token cost low.",
    links: [
      { label: "Create a key", href: "https://platform.deepseek.com/api_keys" },
      { label: "Official pricing", href: "https://api-docs.deepseek.com/quick_start/pricing/" },
    ],
  },
  {
    name: "OpenRouter",
    logo: "openrouter",
    tone: "from-violet-400/20 to-fuchsia-300/10 text-violet-200",
    tagline: "Many providers behind one key",
    models: [
      { name: "OpenAI catalog", price: "Model-specific price" },
      { name: "Anthropic catalog", price: "Model-specific price" },
      { name: ":free models", price: "Free, with limits" },
    ],
    steps: [
      "Create an account and open the key section.",
      "Select Create API Key, name it, and set a limit if desired.",
      "Copy it, select OpenRouter in AALIE, and choose a model.",
    ],
    pricing: "Each model keeps its own input and output price. OpenRouter charges a fee when buying credits and offers free models with daily limits.",
    recommendation: "Recommended for comparing models without creating a separate account at every lab.",
    links: [
      { label: "Create a key", href: "https://openrouter.ai/settings/keys" },
      { label: "Catalog and pricing", href: "https://openrouter.ai/models" },
    ],
  },
  {
    name: "Ollama local / Cloud",
    logo: "ollama",
    tone: "from-lime-300/20 to-green-300/10 text-lime-200",
    tagline: "Local models without per-token charges",
    models: [
      { name: "Local models", price: "No per-token charge" },
      { name: "Ollama Cloud Free", price: "USD 0 / limited" },
      { name: "Ollama Cloud Pro", price: "USD 20 / month" },
    ],
    steps: [
      "Install Ollama and download a model.",
      "Run Ollama and select Ollama local in AALIE.",
      "For Cloud, create a key in settings and select that mode.",
    ],
    pricing: "Local Ollama needs no key or per-token payment: it uses your computer's CPU, GPU, memory, and electricity. Cloud uses usage plans.",
    recommendation: "Recommended for privacy, local experimentation, and hardware that can run the selected model.",
    links: [
      { label: "Download Ollama", href: "https://ollama.com/download" },
      { label: "Official authentication", href: "https://docs.ollama.com/api/authentication" },
    ],
  },
  {
    name: "Mistral AI",
    logo: "mistral-color",
    tone: "from-pink-400/20 to-rose-300/10 text-pink-200",
    tagline: "Open models with a free starting tier",
    models: [
      { name: "Mistral Small 4", price: "USD 0.15 / 0.60 per 1 M" },
      { name: "Mistral Large 3", price: "USD 0.50 / 1.50 per 1 M" },
      { name: "Mistral Medium 3.5", price: "USD 1.50 / 7.50 per 1 M" },
    ],
    steps: [
      "Create an account and open Mistral Studio.",
      "Open API Keys, select Create new key, and set an expiration.",
      "Copy the key immediately and enter it in AALIE.",
    ],
    pricing: "Free mode supports limited usage without a card. Mistral also offers a 50% discount for Batch processing.",
    recommendation: "Recommended for open or European models and an API with a free starting mode.",
    links: [
      { label: "Create a key", href: "https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key" },
      { label: "Official pricing", href: "https://mistral.ai/pricing/api/" },
    ],
  },
  {
    name: "xAI",
    logo: "xai",
    tone: "from-slate-200/20 to-slate-400/10 text-slate-100",
    tagline: "Grok models through an independent API",
    models: [{ name: "Grok 4.6", price: "USD 2.00 / 6.00 per 1 M" }],
    steps: [
      "Create an account and open xAI Console.",
      "Add credits, open API Keys, and select Create API Key.",
      "Copy it and select xAI inside AALIE.",
    ],
    pricing: "For contexts up to 200k tokens, Grok 4.6 has the listed price. Longer contexts cost more.",
    recommendation: "Recommended when Grok or xAI ecosystem tools are specifically what you need.",
    links: [
      { label: "Quickstart", href: "https://docs.x.ai/developers/quickstart" },
      { label: "Official pricing", href: "https://docs.x.ai/developers/pricing" },
    ],
  },
  {
    name: "Groq",
    logo: "groq",
    tone: "from-yellow-300/20 to-orange-300/10 text-yellow-200",
    tagline: "Very low-latency inference for hosted open models",
    models: [
      { name: "Available models", price: "Model-specific" },
      { name: "GroqCloud Free", price: "Free, with limits" },
    ],
    steps: [
      "Create a GroqCloud account and open the console.",
      "Go to API Keys and create a key for your project.",
      "Copy it and select Groq in AALIE.",
    ],
    pricing: "Groq has a free tier with limits. Developer usage is billed according to the selected model.",
    recommendation: "Recommended when inference speed matters or you want hosted open models.",
    links: [
      { label: "Quickstart", href: "https://console.groq.com/docs/quickstart" },
      { label: "Billing", href: "https://console.groq.com/docs/billing-faqs" },
    ],
  },
];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apiKeyHelp.meta" });

  return { title: t("title"), description: t("description") };
}

export default async function ApiKeyHelpPage({ params }: Props) {
  const { locale } = await params;
  const isEnglish = locale === "en";
  const providers = isEnglish ? providersEn : providersEs;
  const copy = isEnglish
    ? {
        eyebrow: "AI provider guide",
        title: "Connect an AI provider",
        subtitle: "AALIE can use external models to explain results, answer questions, compare analyses, and help with pseudocode.",
        noKey: "You do not need an API key to analyze algorithms.",
        noKeyBody: "AALIE's deterministic engine works independently. Adding a provider only enables features that depend on external models.",
        updated: "Prices and procedures change frequently. The values shown were reviewed on August 21, 2026; always check the provider's official page before adding funds.",
        warningTitle: "An API key is not a chat subscription",
        warningBody: "ChatGPT Plus, Claude Pro, Gemini Advanced, and similar consumer subscriptions do not automatically include API balance. Chat apps and developer APIs usually have separate billing.",
        warningTip: "When AALIE asks for a key, get it from the provider's developer platform—not from the chat application.",
        quickTitle: "Before you begin",
        quick: [
          ["01", "Keep it private", "Treat a key like a password. Never post it in GitHub, Discord, screenshots, or source code."],
          ["02", "Create one for AALIE", "Use a separate key when the provider allows it, with a spending limit if available."],
          ["03", "Revoke if exposed", "If someone may have seen it, revoke it in the provider dashboard and create a new one."],
        ],
        tokenTitle: "How API billing works",
        tokenBody: "Most providers charge by tokens: input tokens include your question, pseudocode, and context; output tokens are the generated answer and are usually more expensive. Prices are commonly shown per 1 million tokens, but you only pay for what you use.",
        tokenNote: "Some models also price cached tokens, reasoning, web search, images, audio, or very long contexts differently.",
        providersEyebrow: "Choose your connection",
        providersTitle: "Providers and recommended models",
        providersSubtitle: "There is no universally best provider. Choose the balance of price, capability, speed, and privacy that fits your use.",
        setup: "Quick setup",
        models: "Recommended models",
        pricing: "Pricing note",
        recommended: "Why choose it",
        official: "Official links",
        comparisonTitle: "Quick comparison",
        comparisonHeaders: ["Provider", "Start free", "Billing", "Best for"],
        comparison: [
          ["Gemini", "Yes, selected models", "Tokens", "Simple setup"],
          ["OpenAI", "Do not assume free", "Prepaid + tokens", "Direct GPT access"],
          ["Anthropic", "Do not assume free", "Tokens", "Claude"],
          ["DeepSeek", "Depends on account", "Tokens", "Low cost"],
          ["OpenRouter", "Yes, free models", "Per model", "Comparing models"],
          ["Ollama local", "Yes", "No token fee", "Privacy"],
          ["Mistral / Groq", "Yes, with limits", "Tokens", "Open models / speed"],
        ],
        chooseTitle: "Which one should you choose?",
        choose: [
          "For a first test, Gemini, Mistral, Groq, or a free OpenRouter model are the simplest starting points.",
          "For direct GPT access choose OpenAI; for Claude choose Anthropic.",
          "To minimize token cost, compare DeepSeek and Mistral's economical models.",
          "To try many models with one account, OpenRouter is usually the most convenient.",
          "If you want pseudocode to stay on your own computer, use Ollama local when your hardware can run it.",
        ],
        budgetTitle: "Keep spending under control",
        budget: [
          "Start with the smallest balance or budget you need to test.",
          "Set a monthly or key-specific limit whenever the provider offers one.",
          "Use a different key for each application so you can revoke AALIE without affecting other projects.",
        ],
        finalTitle: "One last warning",
        finalBody: "Never send your key to someone else to “configure it for you”. The AALIE team, a teacher, or a classmate does not need to know your secret key. If it appears in a screenshot, conversation, repository, or public space, consider it compromised: revoke it and generate a new one.",
        back: "Back to AALIE",
      }
    : {
        eyebrow: "Guía de proveedores de IA",
        title: "Conecta un proveedor de inteligencia artificial",
        subtitle: "AALIE puede utilizar modelos externos para explicar resultados, responder preguntas, comparar análisis y ayudarte con el pseudocódigo.",
        noKey: "No necesitas una clave de API para analizar algoritmos.",
        noKeyBody: "El motor determinista de AALIE funciona de manera independiente. Añadir un proveedor solo habilita las funciones que dependen de modelos externos.",
        updated: "Los precios y procedimientos cambian con frecuencia. Los valores mostrados fueron revisados el 21 de agosto de 2026; revisa siempre la página oficial antes de agregar saldo.",
        warningTitle: "Una API key no es una suscripción de chat",
        warningBody: "Pagar ChatGPT Plus, Claude Pro, Gemini Advanced u otra suscripción para consumidores no significa que tengas saldo para utilizar la API. Las aplicaciones de chat y las APIs de desarrolladores suelen tener facturación independiente.",
        warningTip: "Cuando AALIE te pida una clave, obtenla desde la plataforma para desarrolladores del proveedor, no desde la aplicación de chat.",
        quickTitle: "Antes de empezar",
        quick: [
          ["01", "Mantenla privada", "Trata la clave como una contraseña. No la publiques en GitHub, Discord, capturas de pantalla ni código fuente."],
          ["02", "Crea una para AALIE", "Usa una clave independiente cuando el proveedor lo permita y configura un límite de gasto."],
          ["03", "Revócala si se expone", "Si alguien pudo verla, revócala desde el panel del proveedor y crea una nueva."],
        ],
        tokenTitle: "¿Cómo se cobran las APIs?",
        tokenBody: "La mayoría de proveedores cobra por tokens: los tokens de entrada incluyen tu pregunta, pseudocódigo y contexto; los de salida son la respuesta generada y suelen ser más caros. Los precios normalmente se publican por 1 millón de tokens, pero solo pagas lo que utilizas.",
        tokenNote: "Algunos modelos también tienen tarifas distintas para tokens en caché, razonamiento, búsquedas web, imágenes, audio o contextos muy largos.",
        providersEyebrow: "Elige tu conexión",
        providersTitle: "Proveedores y modelos recomendados",
        providersSubtitle: "No existe un proveedor universalmente mejor. Elige el equilibrio de precio, capacidad, velocidad y privacidad que mejor se adapte a ti.",
        setup: "Configuración rápida",
        models: "Modelos recomendados",
        pricing: "Nota de precios",
        recommended: "Por qué elegirlo",
        official: "Enlaces oficiales",
        comparisonTitle: "Comparación rápida",
        comparisonHeaders: ["Proveedor", "Empezar gratis", "Cobro", "Ideal para"],
        comparison: [
          ["Gemini", "Sí, algunos modelos", "Tokens", "Configuración sencilla"],
          ["OpenAI", "No asumir nivel gratuito", "Saldo + tokens", "Acceso directo a GPT"],
          ["Anthropic", "No asumir nivel gratuito", "Tokens", "Claude"],
          ["DeepSeek", "Depende de la cuenta", "Tokens", "Coste bajo"],
          ["OpenRouter", "Sí, modelos gratuitos", "Por modelo", "Comparar modelos"],
          ["Ollama local", "Sí", "Sin cobro por token", "Privacidad"],
          ["Mistral / Groq", "Sí, con límites", "Tokens", "Modelos abiertos / velocidad"],
        ],
        chooseTitle: "¿Cuál deberías elegir?",
        choose: [
          "Para probar el asistente, Gemini, Mistral, Groq u OpenRouter con un modelo gratuito son los puntos de entrada más sencillos.",
          "Si quieres acceso directo a GPT, utiliza OpenAI; si quieres Claude, utiliza Anthropic.",
          "Para minimizar el coste por token, compara DeepSeek y los modelos económicos de Mistral.",
          "Para probar muchos modelos con una sola cuenta, OpenRouter suele ser la opción más cómoda.",
          "Si prefieres que el pseudocódigo permanezca en tu computador, utiliza Ollama local cuando tu hardware pueda ejecutar el modelo.",
        ],
        budgetTitle: "Evita gastar más de lo esperado",
        budget: [
          "Empieza con el saldo o presupuesto mínimo que necesites para probar.",
          "Configura un límite mensual o específico para la clave siempre que el proveedor lo permita.",
          "Usa una clave diferente para cada aplicación: así podrás revocar la de AALIE sin afectar otros proyectos.",
        ],
        finalTitle: "Una última advertencia",
        finalBody: "Nunca envíes tu clave a otra persona para que “la configure por ti”. El equipo de AALIE, un profesor o un compañero no necesita conocer tu clave secreta. Si aparece en una captura, conversación, repositorio o espacio público, considérala comprometida: revócala y genera una nueva.",
        back: "Volver a AALIE",
      };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="relative z-10 flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
          <section className="api-help-reveal relative space-y-6">
            <div className="relative flex items-center gap-3">
              <KeyRound className="api-help-key-icon h-8 w-8 text-purple-300" strokeWidth={1.6} />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.eyebrow}</p>
            </div>
            <h1 className="relative text-3xl font-extrabold leading-tight text-white sm:text-4xl">{copy.title}</h1>
            <p className="relative text-lg leading-8 text-slate-200">{copy.subtitle}</p>
            <p className="relative border-l-2 border-emerald-300/60 pl-4 text-[15px] font-semibold leading-7 text-emerald-100">{copy.noKey}</p>
            <p className="relative text-[15px] leading-7 text-dark-text">{copy.noKeyBody}</p>
            <p className="relative text-sm italic leading-6 text-slate-400">{copy.updated}</p>
          </section>

          <section className="api-help-reveal api-help-delay-1 space-y-5 border-y border-amber-300/20 py-7">
            <div className="flex items-start gap-4">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">{copy.warningTitle}</h2>
                <p className="mt-3 text-[15px] leading-7 text-dark-text">{copy.warningBody}</p>
                <p className="mt-3 border-l-2 border-amber-200/50 pl-4 text-sm font-medium leading-6 text-amber-100">{copy.warningTip}</p>
              </div>
            </div>
          </section>

          <section className="api-help-reveal api-help-delay-2 space-y-5">
            {copy.quick.map(([number, title, body]) => (
              <article key={number} className="flex items-start gap-4">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">{number}</span>
                <div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <p className="mt-1 text-[15px] leading-7 text-dark-text">{body}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="api-help-reveal api-help-delay-3 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">Tokens, saldo y límites</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">{copy.tokenTitle}</h2>
            </div>
            <div className="space-y-4 text-[15px] leading-7 text-dark-text">
              <p>{copy.tokenBody}</p>
              <p className="border-l-2 border-cyan-300/50 pl-4 text-cyan-100/80">{copy.tokenNote}</p>
            </div>
          </section>

          <section id="providers" className="scroll-mt-6 space-y-8">
            <div className="api-help-reveal space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.providersEyebrow}</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{copy.providersTitle}</h2>
              <p className="text-[15px] leading-7 text-dark-text">{copy.providersSubtitle}</p>
            </div>
            <div className="space-y-10">
              {providers.map((provider, index) => {
                return (
                  <article key={provider.name} className="api-help-provider space-y-5 border-t border-white/10 pt-8" style={{ animationDelay: `${index * 70}ms` }}>
                    <header className="flex items-start gap-4">
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${provider.tone}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/${provider.logo}.svg`}
                          alt=""
                          aria-hidden="true"
                          className="h-5 w-5 object-contain brightness-0 invert"
                        />
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{provider.name}</h3>
                        <p className="mt-1 text-[15px] leading-6 text-dark-text">{provider.tagline}</p>
                      </div>
                    </header>

                    <div className="space-y-5 pl-0 sm:pl-14">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-purple-300" />{copy.models}</h4>
                        <ul className="mt-2 divide-y divide-white/[0.08] border-y border-white/[0.08] text-sm">
                          {provider.models.map((model) => (
                            <li key={model.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-dark-text">
                              <span className="font-medium text-slate-100">{model.name}</span>
                              <span className="text-xs text-slate-400">{model.price}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound className="h-4 w-4 text-amber-300" />{copy.setup}</h4>
                        <ol className="mt-2 space-y-2 text-[15px] leading-6 text-dark-text">
                          {provider.steps.map((step, stepIndex) => (
                            <li key={step} className="flex items-start gap-3"><span className="text-xs font-semibold text-slate-500">{stepIndex + 1}.</span><span>{step}</span></li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-3 text-[15px] leading-7 text-dark-text">
                      <p><strong className="font-semibold text-white">{copy.pricing}: </strong>{provider.pricing}</p>
                      <p><strong className="font-semibold text-white">{copy.recommended}: </strong>{provider.recommendation}</p>
                      <p className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-sm">
                        <span className="font-semibold text-slate-400">{copy.official}:</span>
                        {provider.links.map((link) => (
                          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200">
                            {link.label}<ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="api-help-reveal space-y-5">
            <div className="flex items-center gap-3"><CircleDollarSign className="h-5 w-5 text-emerald-300" /><h2 className="text-2xl font-semibold tracking-tight text-white">{copy.comparisonTitle}</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-400"><tr>{copy.comparisonHeaders.map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}</tr></thead>
                  <tbody className="divide-y divide-white/[0.08] text-dark-text">{copy.comparison.map((row) => <tr key={row[0]}>{row.map((cell, cellIndex) => <td key={`${row[0]}-${cellIndex}`} className={`px-3 py-3 ${cellIndex === 0 ? "font-semibold text-white" : ""}`}>{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
          </section>

          <section className="api-help-reveal space-y-5">
            <header><h2 className="text-2xl font-semibold tracking-tight text-white">{copy.chooseTitle}</h2></header>
            <ul className="space-y-3 text-[15px] leading-7 text-dark-text">{copy.choose.map((item) => <li key={item} className="flex items-start gap-3"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-purple-300" />{item}</li>)}</ul>
          </section>

          <section className="api-help-reveal space-y-5">
            <header><h2 className="text-2xl font-semibold tracking-tight text-white">{copy.budgetTitle}</h2></header>
            <ul className="space-y-3 text-[15px] leading-7 text-dark-text">{copy.budget.map((item) => <li key={item} className="flex items-start gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}</ul>
          </section>

          <section className="api-help-reveal space-y-5 border-t border-red-300/20 pt-8">
            <header className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-300" /><h2 className="text-2xl font-semibold tracking-tight text-white">{copy.finalTitle}</h2></header>
            <p className="text-[15px] leading-7 text-dark-text">{copy.finalBody}</p>
          </section>

          <NavigationLink href="/" className="api-help-reveal inline-flex items-center gap-2 self-start text-sm font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200 focus-visible-enhanced"><ArrowRight className="h-4 w-4 rotate-180" />{copy.back}</NavigationLink>
        </div>
      </main>

      <Footer />
    </div>
  );
}
