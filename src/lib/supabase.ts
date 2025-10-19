// Cliente mock do Supabase para desenvolvimento
// Permite login funcional sem configurar Supabase real

export const supabase = {
  auth: {
    getSession: () => {
      console.log('🔄 Mock: getSession chamado');
      // Verificar se há um usuário "logado" no localStorage
      const storedUser = localStorage.getItem('mock_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          return Promise.resolve({ 
            data: { 
              session: { 
                user: user,
                access_token: 'mock_token',
                refresh_token: 'mock_refresh'
              } 
            }, 
            error: null 
          });
        } catch (e) {
          localStorage.removeItem('mock_user');
        }
      }
      
      return Promise.resolve({ 
        data: { session: null }, 
        error: null 
      });
    },
    
    onAuthStateChange: (callback: any) => {
      console.log('🔄 Mock: onAuthStateChange configurado');
      
      // Simular mudança de estado no próximo tick
      setTimeout(() => {
        const storedUser = localStorage.getItem('mock_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            callback('SIGNED_IN', { 
              user: user,
              access_token: 'mock_token',
              refresh_token: 'mock_refresh'
            });
          } catch (e) {
            callback('SIGNED_OUT', null);
          }
        } else {
          callback('SIGNED_OUT', null);
        }
      }, 100);
      
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              console.log('🔄 Mock: subscription cancelada');
            }
          } 
        } 
      };
    },
    
    signInWithPassword: ({ email, password }: { email: string; password: string }) => {
      console.log('🔄 Mock: Tentativa de login com:', email, 'senha:', password);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          if (email === 'teste@teste.com' && password === '123456') {
            const user = { 
              id: 'mock-user-1', 
              email: email,
              email_confirmed_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            };
            
            // Salvar no localStorage para persistir sessão
            localStorage.setItem('mock_user', JSON.stringify(user));
            
            console.log('✅ Mock: Login bem-sucedido para:', email);
            resolve({ 
              data: { user: user }, 
              error: null 
            });
          } else {
            console.log('❌ Mock: Credenciais incorretas');
            resolve({ 
              data: { user: null }, 
              error: { 
                message: 'Credenciais inválidas. Use teste@teste.com / 123456',
                status: 400
              } 
            });
          }
        }, 1000); // Simular delay de rede
      });
    },
    
    signUp: ({ email, password }: { email: string; password: string }) => {
      console.log('🔄 Mock: Tentativa de cadastro com:', email);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const user = { 
            id: 'mock-user-' + Date.now(), 
            email: email,
            email_confirmed_at: null, // Email não confirmado
            created_at: new Date().toISOString()
          };
          
          console.log('✅ Mock: Cadastro bem-sucedido para:', email);
          resolve({ 
            data: { user: user }, 
            error: null 
          });
        }, 1000); // Simular delay de rede
      });
    },
    
    signOut: () => {
      console.log('🔄 Mock: Logout realizado');
      
      return new Promise((resolve) => {
        setTimeout(() => {
          // Remover usuário do localStorage
          localStorage.removeItem('mock_user');
          
          console.log('✅ Mock: Logout concluído');
          resolve({ error: null });
        }, 500);
      });
    }
  }
};