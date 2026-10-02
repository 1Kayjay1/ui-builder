function object(value: unknown, name: string): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`);
  return value as Record<string, any>;
}
function string(v: unknown, name: string) { if (typeof v !== 'string') throw new Error(`${name} must be a string`); return v; }
function array(v: unknown, name: string) { if (!Array.isArray(v)) throw new Error(`${name} must be an array`); return v; }

export const receiptSchema = {
  parse(value: unknown) {
    const v=object(value,'receipt'); if(v.schemaVersion!==1) throw new Error('receipt.schemaVersion must be 1');
    string(v.packageVersion,'receipt.packageVersion'); string(v.installedAt,'receipt.installedAt');
    if(!['project','global'].includes(v.scope)) throw new Error('receipt.scope is invalid'); string(v.root,'receipt.root');
    object(v.adapters,'receipt.adapters'); array(v.managedFiles,'receipt.managedFiles'); array(v.backups,'receipt.backups'); array(v.generatedArtifacts,'receipt.generatedArtifacts');
    for(const f of v.managedFiles){const x=object(f,'managed file'); string(x.path,'managedFile.path'); string(x.sha256,'managedFile.sha256');}
    return v as any;
  }
};

function parseRegistryItem(value: unknown) {
  const v=object(value,'registry item'); for(const k of ['id','name','source','sourceUrl','verifiedAt']) string(v[k],`registry.${k}`);
  for(const k of ['categories','capabilities','frameworks','dependencies','visualTags','interactionTags']) array(v[k],`registry.${k}`);
  const lic=object(v.license,'registry.license'); string(lic.name,'license.name'); if(!['allowed','restricted','unknown'].includes(lic.redistribution)) throw new Error('license.redistribution invalid');
  const install=object(v.install,'registry.install'); if(!['package','canonical-page','canonical-command'].includes(install.mode)) throw new Error('install.mode invalid');
  object(v.accessibility,'registry.accessibility'); object(v.performance,'registry.performance'); return v as any;
}
export const registrySchema = { parse(value: unknown){const v=object(value,'registry'); if(v.schemaVersion!==1) throw new Error('registry.schemaVersion must be 1'); const items=array(v.items,'registry.items').map(parseRegistryItem); return {...v,items} as any;} };

export const designProfileSchema = { parse(value: unknown){const v=object(value,'design profile'); if(v.schemaVersion!=='1.0') throw new Error('design profile schemaVersion must be 1.0'); for(const k of ['project','identity','tokens','typography','layout','surfaces','motion','interaction','advancedGraphics','accessibility']) object(v[k],`profile.${k}`); array(v.antiPatterns,'profile.antiPatterns'); array(v.sources,'profile.sources'); if(v.interaction.stateIntegrity!=='real-state-only') throw new Error('profile interaction stateIntegrity must be real-state-only'); return v as any;} };
