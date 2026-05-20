interface ContactCardProps {
  name: string;
  role: string;
  email: string;
  github?: string;
}

export function ContactCard({ name, role, email, github }: ContactCardProps) {
  const githubHandle = github?.replace("@", "");

  return (
    <article className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6">
      <h3 className="text-base font-semibold text-white sm:text-lg">{name}</h3>
      <p className="mt-1 text-sm text-slate-400">{role}</p>

      <div className="mt-5 flex flex-col gap-3 text-sm">
        <a
          className="rounded-lg text-primary transition-colors hover:text-blue-300 hover:underline focus-visible-enhanced"
          href={`mailto:${email}`}
        >
          {email}
        </a>

        {github && githubHandle ? (
          <a
            className="rounded-lg text-dark-text transition-colors hover:text-white hover:underline focus-visible-enhanced"
            href={`https://github.com/${githubHandle}`}
            target="_blank"
            rel="noreferrer"
          >
            {github}
          </a>
        ) : null}
      </div>
    </article>
  );
}
