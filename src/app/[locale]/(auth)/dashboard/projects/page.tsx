import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Input } from '@/components/ui/input';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import { organizationSchema, projectSchema } from '@/models/Schema';

async function getProjects(organizationId: string) {
  return db
    .select()
    .from(projectSchema)
    .where(eq(projectSchema.organizationId, organizationId))
    .orderBy(desc(projectSchema.updatedAt));
}

async function createProject(formData: FormData) {
  'use server';
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    redirect('/onboarding/organization-selection');
  }

  const name = formData.get('name')?.toString().trim() || '';
  if (!name) {
    return;
  }

  // Ensure the organization row exists before inserting the project
  await db
    .insert(organizationSchema)
    .values({ id: orgId })
    .onConflictDoNothing({ target: organizationSchema.id });

  await db.insert(projectSchema).values({
    name,
    organizationId: orgId,
    createdBy: userId,
  });

  revalidatePath('/dashboard/projects');
}

export default async function ProjectsPage() {
  const { orgId } = await auth();
  if (!orgId) {
    redirect('/onboarding/organization-selection');
  }

  const projects = await getProjects(orgId);

  return (
    <>
      <TitleBar title="Projects" description="Create or select a project." />

      <div className="grid gap-5 md:grid-cols-[1fr,320px]">
        <DashboardSection title="Your projects" description="Select a project to open it.">
          <div className="flex flex-col gap-2">
            {projects.length === 0 && (
              <div className="text-sm text-muted-foreground">No projects yet.</div>
            )}

            {projects.map(project => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className={buttonVariants({ variant: 'ghost', className: 'justify-start' })}
              >
                <div className="flex flex-col text-left">
                  <span className="font-semibold">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Updated
                    {' '}
                    {project.updatedAt?.toLocaleString?.() ?? ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Create project" description="Give your project a name.">
          <form action={createProject} className="space-y-3">
            <Input name="name" placeholder="Project name" required />
            <button type="submit" className={buttonVariants({ className: 'w-full' })}>
              Create
            </button>
          </form>
        </DashboardSection>
      </div>
    </>
  );
}
