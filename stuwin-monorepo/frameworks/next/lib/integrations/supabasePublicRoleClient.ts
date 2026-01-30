const supabase: any = {
    from: () => supabase,
    select: () => supabase,
    eq: () => supabase,
    single: () => Promise.resolve({ data: {}, error: null }),
    order: () => supabase,
    limit: () => supabase,
    insert: () => supabase,
    update: () => supabase,
    delete: () => supabase,
    match: () => supabase,
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: {}, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            remove: () => Promise.resolve({ error: null }),
        })
    },
    auth: {
        admin: {
            createUser: () => Promise.resolve({ data: { user: {} }, error: null }),
            deleteUser: () => Promise.resolve({ error: null }),
        }
    }
};

export default supabase;
