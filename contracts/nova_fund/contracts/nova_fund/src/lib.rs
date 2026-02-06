#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Val, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    TargetAmount, 
    Deadline,     
    RaisedAmount, 
    Donations(Address), 
    State,        
}

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum State {
    Running = 0,
    Success = 1,
    Expired = 2,
}

#[contract]
pub struct NovaFund;

#[contractimpl]
impl NovaFund {
    pub fn initialize(env: Env, target: i128, deadline: u64) {
        if env.storage().instance().has(&DataKey::TargetAmount) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::TargetAmount, &target);
        env.storage().instance().set(&DataKey::Deadline, &deadline);
        env.storage().instance().set(&DataKey::RaisedAmount, &0i128);
        env.storage().instance().set(&DataKey::State, &State::Running);
    }

    pub fn donate(env: Env, donor: Address, amount: i128) {
        donor.require_auth();

        let current_time = env.ledger().timestamp();
        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        let mut state: State = env.storage().instance().get(&DataKey::State).unwrap();

        if current_time >= deadline {
             
             if state == State::Running {
                 
                 panic!("Campaign expired");
             }
        }
        
        if state != State::Running {
            panic!("Campaign not running");
        }

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        
        let mut raised: i128 = env.storage().instance().get(&DataKey::RaisedAmount).unwrap();
        raised += amount;
        env.storage().instance().set(&DataKey::RaisedAmount, &raised);


        let key = DataKey::Donations(donor.clone());
        let mut donor_total: i128 = env.storage().instance().get(&key).unwrap_or(0);
        donor_total += amount;
        env.storage().instance().set(&key, &donor_total);

       
        let target: i128 = env.storage().instance().get(&DataKey::TargetAmount).unwrap();
        if raised >= target {
            env.storage().instance().set(&DataKey::State, &State::Success);
        }

       
        let topics = (Symbol::new(&env, "donation"), donor);
        env.events().publish(topics, amount);
    }

    pub fn get_state(env: Env) -> (i128, i128, u64, u32) {
        let target: i128 = env.storage().instance().get(&DataKey::TargetAmount).unwrap_or(0);
        let raised: i128 = env.storage().instance().get(&DataKey::RaisedAmount).unwrap_or(0);
        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline).unwrap_or(0);
        let state: State = env.storage().instance().get(&DataKey::State).unwrap_or(State::Running);
        (target, raised, deadline, state as u32)
    }
}
