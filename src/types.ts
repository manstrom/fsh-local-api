export interface Pokemon {
  id: number;
  name: string;
  type: string;
  hp: number;
  attack: number;
  caught: boolean;
  created_at: string;
}

export interface CreatePokemonBody {
  name: string;
  type: string;
  hp: number;
  attack: number;
  caught?: boolean;
}

export interface UpdatePokemonBody {
  name?: string;
  type?: string;
  hp?: number;
  attack?: number;
  caught?: boolean;
}