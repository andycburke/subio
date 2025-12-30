import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Input } from '@/components/ui/input';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import { projectConfigSchema, projectSchema, revisionSchema } from '@/models/Schema';

type ProjectConfigData = {
  substationName?: string;
  voltageKv?: number;
  transformerCount?: number;
};

async function getProject(projectId: string, orgId: string) {
  const rows = await db
    .select()
    .from(projectSchema)
    .where(and(eq(projectSchema.id, projectId), eq(projectSchema.organizationId, orgId)));
  return rows[0];
}

async function getRevisions(projectId: string) {
  return db
    .select()
    .from(revisionSchema)
    .where(eq(revisionSchema.projectId, projectId))
    .orderBy(desc(revisionSchema.createdAt));
}

async function getConfig(projectId: string, revisionId: string | null) {
  const rows = await db
    .select()
    .from(projectConfigSchema)
    .where(
      and(
        eq(projectConfigSchema.projectId, projectId),
        revisionId ? eq(projectConfigSchema.revisionId, revisionId) : isNull(projectConfigSchema.revisionId),
      ),
    );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return { ...row, data: (row.data as ProjectConfigData) ?? {} };
}

export default async function ProjectDetailPage({ params, searchParams }: { params: { projectId: string }; searchParams: { rev?: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect('/onboarding/organization-selection');
  }

  const project = await getProject(params.projectId, orgId);
  if (!project) {
    notFound();
  }

  const revisions = await getRevisions(project.id);
  const latestRevisionId = revisions[0]?.id ?? null;
  const requestedRevisionId = typeof searchParams?.rev === 'string' ? searchParams.rev : undefined;
  const activeRevisionId = requestedRevisionId && revisions.some(r => r.id === requestedRevisionId)
    ? requestedRevisionId
    : latestRevisionId ?? null;
  const config = await getConfig(project.id, activeRevisionId ?? null);

  async function createRevision(formData: FormData) {
    'use server';
    const { userId } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }

    const projectId = formData.get('projectId')?.toString() ?? '';
    const versionLabel = formData.get('versionLabel')?.toString().trim() ?? '';
    const comment = formData.get('comment')?.toString().trim() ?? '';
    if (!projectId || !versionLabel) {
      return;
    }

    await db.insert(revisionSchema).values({
      projectId,
      createdBy: userId,
      versionLabel,
      comment,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
  }

  async function saveConfig(formData: FormData) {
    'use server';
    const { userId } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }

    const projectId = formData.get('projectId')?.toString() ?? '';
    const revisionId = formData.get('revisionId')?.toString() || null;
    const name = formData.get('substationName')?.toString().trim() ?? '';
    const voltageKv = Number(formData.get('voltageKv') ?? 0);
    const transformerCount = Number(formData.get('transformerCount') ?? 0);

    if (!projectId) {
      return;
    }

    const payload: ProjectConfigData = {
      substationName: name,
      voltageKv,
      transformerCount,
    };

    await db
      .insert(projectConfigSchema)
      .values({
        projectId,
        revisionId: revisionId ?? null,
        createdBy: userId,
        data: payload as unknown as never,
      })
      .onConflictDoUpdate({
        target: [projectConfigSchema.projectId, projectConfigSchema.revisionId],
        set: { data: payload as unknown as never },
      });

    revalidatePath(`/dashboard/projects/${projectId}`);
  }

  return (
    <>
      <TitleBar title={project.name} description="Configure substation details and manage revisions." />

      <div className="grid gap-5 md:grid-cols-2">
        <DashboardSection title="Revisions" description="Create and select a revision.">
          <form action={createRevision} className="space-y-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Version label</div>
              <Input name="versionLabel" placeholder="e.g., v1.0" required />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Comment</div>
              <Input name="comment" placeholder="What changed (optional)" />
            </div>
            <button type="submit" className={buttonVariants({ className: 'w-full' })}>Create revision</button>
          </form>

          <div className="mt-4">
            <label htmlFor="rev-select" className="text-sm font-medium text-muted-foreground">Select revision</label>
            <form method="GET" className="mt-1">
              <select
                id="rev-select"
                name="rev"
                defaultValue={activeRevisionId ?? ''}
                className="w-full rounded-md border p-2"
              >
                <option value="">(None)</option>
                {revisions.map(r => (
                  <option key={r.id} value={r.id}>{r.versionLabel}</option>
                ))}
              </select>
              <button type="submit" className={buttonVariants({ variant: 'secondary', className: 'mt-2 w-full' })}>Load revision</button>
            </form>
          </div>
        </DashboardSection>

        <div className="md:col-start-1 md:col-end-2 md:row-start-2">
          <DashboardSection title="Substation Configuration" description="Answer basic configuration questions.">
            <form action={saveConfig} className="space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="revisionId" value={activeRevisionId ?? ''} />

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Substation name</div>
                <Input name="substationName" placeholder="e.g., North Yard" defaultValue={config?.data?.substationName ?? ''} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Voltage level (kV)</div>
                <Input name="voltageKv" placeholder="e.g., 230" defaultValue={config?.data?.voltageKv ?? ''} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Transformer count</div>
                <Input name="transformerCount" placeholder="e.g., 3" defaultValue={config?.data?.transformerCount ?? ''} />
              </div>

              <button type="submit" className={buttonVariants({ className: 'w-full' })}>Save configuration</button>
            </form>
          </DashboardSection>
        </div>
      </div>
    </>
  );
}
