import { NextResponse } from 'next/server';
import playersData from '@/data/players.json';

export async function GET() {
  try {
    return NextResponse.json(playersData);
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { message: 'Failed to fetch players' },
      { status: 500 }
    );
  }
} 